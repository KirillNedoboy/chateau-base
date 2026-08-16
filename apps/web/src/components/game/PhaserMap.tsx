"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  INTERACTION_ZONES,
  MAP_ART_ASSET_PATH,
  MAP_HEIGHT,
  MAP_PROMPT_Y,
  MAP_WIDTH,
  PLAYER_START,
  PLAYER_SPRITE_ASSET_PATH,
  type InteractionZone,
  type InteractionZoneId
} from "../../game/mapConfig";
import type Phaser from "phaser";

type PhaserMapProps = {
  onInteract: (zoneId: InteractionZoneId) => void;
};

type MobileInput = {
  x: number;
  y: number;
};

type JoystickVisualState = {
  x: number;
  y: number;
};

const PLAYER_SPEED = 170;
const PLAYER_RADIUS = 13;
const PLAYER_SPRITE_WIDTH = 90;
const PLAYER_SPRITE_HEIGHT = 128;
const JOYSTICK_RADIUS = 42;
const MAP_ART_KEY = "chateau-map-art";
const PLAYER_SPRITE_KEY = "chateau-player-winemaker";

function normalizeVector(x: number, y: number): MobileInput {
  const magnitude = Math.hypot(x, y);
  if (magnitude <= 1) {
    return { x, y };
  }

  return {
    x: x / magnitude,
    y: y / magnitude
  };
}

function findZoneAtPoint(x: number, y: number): InteractionZone | null {
  return (
    INTERACTION_ZONES.find((zone) => {
      const left = zone.x - zone.width / 2;
      const right = zone.x + zone.width / 2;
      const top = zone.y - zone.height / 2;
      const bottom = zone.y + zone.height / 2;
      return x >= left && x <= right && y >= top && y <= bottom;
    }) ?? null
  );
}

export function PhaserMap({ onInteract }: PhaserMapProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const mobileInputRef = useRef<MobileInput>({ x: 0, y: 0 });
  const interactRef = useRef<(() => void) | null>(null);
  const onInteractRef = useRef(onInteract);
  const [joystickVisual, setJoystickVisual] = useState<JoystickVisualState>({
    x: 0,
    y: 0
  });

  useEffect(() => {
    onInteractRef.current = onInteract;
  }, [onInteract]);

  useEffect(() => {
    let game: Phaser.Game | null = null;
    let destroyed = false;
    let clearInteractHandler: (() => void) | null = null;

    async function bootPhaser() {
      const PhaserRuntime = await import("phaser");
      if (destroyed || !mountRef.current) {
        return;
      }

      class ChateauMapScene extends PhaserRuntime.Scene {
        private player!: Phaser.GameObjects.Image;
        private playerMarker!: Phaser.GameObjects.Triangle;
        private cursors: Phaser.Types.Input.Keyboard.CursorKeys | null = null;
        private keyW: Phaser.Input.Keyboard.Key | null = null;
        private keyA: Phaser.Input.Keyboard.Key | null = null;
        private keyS: Phaser.Input.Keyboard.Key | null = null;
        private keyD: Phaser.Input.Keyboard.Key | null = null;
        private promptText!: Phaser.GameObjects.Text;
        private activeZoneId: InteractionZoneId | null = null;
        private zoneGraphics = new Map<
          InteractionZoneId,
          Phaser.GameObjects.Rectangle
        >();

        constructor() {
          super("ChateauMapScene");
        }

        preload() {
          this.load.image(MAP_ART_KEY, MAP_ART_ASSET_PATH);
          this.load.image(PLAYER_SPRITE_KEY, PLAYER_SPRITE_ASSET_PATH);
        }

        create() {
          this.drawGround();

          for (const zone of INTERACTION_ZONES) {
            this.drawZone(zone);
          }

          this.player = this.add
            .image(PLAYER_START.x, PLAYER_START.y + 58, PLAYER_SPRITE_KEY)
            .setOrigin(0.5, 1)
            .setDisplaySize(PLAYER_SPRITE_WIDTH, PLAYER_SPRITE_HEIGHT)
            .setDepth(20);
          this.playerMarker = this.add
            .triangle(
              PLAYER_START.x,
              PLAYER_START.y - 58,
              0,
              0,
              12,
              0,
              6,
              12,
              0x4387ff
            )
            .setOrigin(0.5)
            .setDepth(21);

          this.promptText = this.add
            .text(MAP_WIDTH / 2, MAP_PROMPT_Y, "", {
              align: "center",
              backgroundColor: "#111827",
              color: "#f7efe1",
              fontFamily: "system-ui, sans-serif",
              fontSize: "15px",
              fontStyle: "700",
              padding: {
                x: 14,
                y: 8
              }
            })
            .setOrigin(0.5)
            .setDepth(30)
            .setVisible(false);

          this.cursors = this.input.keyboard?.createCursorKeys() ?? null;
          this.keyW =
            this.input.keyboard?.addKey(PhaserRuntime.Input.Keyboard.KeyCodes.W) ??
            null;
          this.keyA =
            this.input.keyboard?.addKey(PhaserRuntime.Input.Keyboard.KeyCodes.A) ??
            null;
          this.keyS =
            this.input.keyboard?.addKey(PhaserRuntime.Input.Keyboard.KeyCodes.S) ??
            null;
          this.keyD =
            this.input.keyboard?.addKey(PhaserRuntime.Input.Keyboard.KeyCodes.D) ??
            null;
          this.input.keyboard?.on("keydown-E", () => {
            this.interactWithActiveZone();
          });

          interactRef.current = () => {
            this.interactWithActiveZone();
          };
          clearInteractHandler = () => {
            if (interactRef.current) {
              interactRef.current = null;
            }
          };
        }

        override update(_time: number, delta: number) {
          const keyboardVector = this.getKeyboardVector();
          const mobileVector = mobileInputRef.current;
          const movement = normalizeVector(
            keyboardVector.x + mobileVector.x,
            keyboardVector.y + mobileVector.y
          );
          const distance = PLAYER_SPEED * (delta / 1000);

          this.player.x = PhaserRuntime.Math.Clamp(
            this.player.x + movement.x * distance,
            PLAYER_RADIUS,
            MAP_WIDTH - PLAYER_RADIUS
          );
          this.player.y = PhaserRuntime.Math.Clamp(
            this.player.y + movement.y * distance,
            PLAYER_RADIUS,
            MAP_HEIGHT - PLAYER_RADIUS
          );
          this.playerMarker.x = this.player.x;
          this.playerMarker.y = this.player.y - PLAYER_SPRITE_HEIGHT - 8;

          this.updateActiveZone();
        }

        private getKeyboardVector(): MobileInput {
          const left = Boolean(this.cursors?.left.isDown || this.keyA?.isDown);
          const right = Boolean(this.cursors?.right.isDown || this.keyD?.isDown);
          const up = Boolean(this.cursors?.up.isDown || this.keyW?.isDown);
          const down = Boolean(this.cursors?.down.isDown || this.keyS?.isDown);

          return normalizeVector(
            Number(right) - Number(left),
            Number(down) - Number(up)
          );
        }

        private drawGround() {
          this.add
            .image(0, 0, MAP_ART_KEY)
            .setOrigin(0)
            .setDisplaySize(MAP_WIDTH, MAP_HEIGHT)
            .setDepth(0);

          const graphics = this.add.graphics();
          graphics.fillStyle(0x05100a, 0.14);
          graphics.fillRect(0, 0, MAP_WIDTH, MAP_HEIGHT);
        }

        private drawZone(zone: InteractionZone) {
          const rectangle = this.add
            .rectangle(zone.x, zone.y, zone.width, zone.height)
            .setFillStyle(zone.fill, 0.025)
            .setStrokeStyle(1, zone.stroke, 0.16)
            .setDepth(14);
          this.zoneGraphics.set(zone.id, rectangle);
        }

        private drawZoneDecoration(zone: InteractionZone) {
          const left = zone.x - zone.width / 2;
          const top = zone.y - zone.height / 2;
          const centerX = zone.x;
          const centerY = zone.y - 2;

          if (zone.kind === "chateau") {
            this.add.rectangle(centerX, centerY + 16, zone.width - 44, 78, 0xbca47d).setDepth(8);
            this.add.rectangle(centerX, centerY + 42, zone.width - 86, 38, 0x8f7658).setDepth(9);
            this.add
              .triangle(centerX, top - 4, 0, 66, zone.width - 20, 66, (zone.width - 20) / 2, 0, 0x26384f)
              .setDepth(8);
            this.add.rectangle(centerX, centerY + 36, 34, 44, 0x402a24).setDepth(10);
            this.add.rectangle(centerX, centerY - 2, 54, 58, 0xc1a474).setDepth(10);
            this.add.rectangle(centerX, centerY + 3, 36, 42, 0x0f3d83).setDepth(11);
            this.add.text(centerX, centerY - 4, "CB", {
              align: "center",
              color: "#c7a35d",
              fontFamily: "Georgia, serif",
              fontSize: "20px",
              fontStyle: "800"
            }).setOrigin(0.5).setDepth(12);
            for (const offset of [-128, -76, 76, 128]) {
              this.add.rectangle(centerX + offset, centerY + 8, 20, 42, 0x172f45).setDepth(10);
              this.add.rectangle(centerX + offset, centerY + 8, 12, 30, 0xe1a84e).setDepth(11);
            }
            return;
          }

          if (zone.kind === "plot") {
            const graphics = this.add.graphics().setDepth(9);
            graphics.fillStyle(0x29381d, 0.68);
            graphics.fillRoundedRect(left + 10, top + 16, zone.width - 20, zone.height - 46, 10);
            graphics.lineStyle(5, 0x6e4f2e, 0.78);
            for (let x = left + 26; x <= left + zone.width - 18; x += 34) {
              graphics.lineBetween(x, top + 18, x, top + zone.height - 42);
            }
            graphics.lineStyle(4, 0x86a850, 0.9);
            for (let y = top + 30; y <= top + zone.height - 52; y += 18) {
              graphics.lineBetween(left + 18, y, left + zone.width - 18, y + 8);
            }
            graphics.fillStyle(0x4f2365, 0.86);
            for (let x = left + 28; x <= left + zone.width - 28; x += 30) {
              graphics.fillCircle(x, centerY - 12, 4);
              graphics.fillCircle(x + 8, centerY + 10, 3);
            }
            return;
          }

          if (zone.kind === "cellar") {
            this.add.circle(centerX - 18, centerY - 4, 54, 0x84715d).setDepth(8);
            this.add.circle(centerX - 18, centerY - 4, 38, 0x1f1715).setDepth(9);
            this.add.rectangle(centerX + 28, centerY + 16, 46, 34, 0x6f4028).setDepth(9);
            this.add.rectangle(centerX + 28, centerY + 15, 54, 8, 0x3a2219).setDepth(10);
            return;
          }

          if (zone.kind === "production") {
            this.add.rectangle(centerX - 30, centerY + 12, 52, 58, 0x7f4a33).setDepth(8);
            this.add.ellipse(centerX - 30, centerY - 18, 52, 26, 0xb97b3c).setDepth(9);
            this.add.ellipse(centerX - 30, centerY + 40, 52, 20, 0x4e2b1d).setDepth(9);
            this.add.ellipse(centerX + 38, centerY + 9, 44, 62, 0xc77b36).setDepth(8);
            this.add.rectangle(centerX + 38, centerY + 9, 44, 36, 0x8b4c2a).setDepth(9);
            this.add.rectangle(centerX + 38, centerY - 23, 18, 22, 0x4d3328).setDepth(10);
            return;
          }

          if (zone.kind === "shop" || zone.kind === "market") {
            const graphics = this.add.graphics().setDepth(9);
            graphics.fillStyle(0x5d3d2f, 1);
            graphics.fillRoundedRect(left + 24, top + 38, zone.width - 48, 50, 8);
            graphics.fillStyle(zone.kind === "shop" ? 0x1f4a8a : 0x9c4331, 0.95);
            graphics.fillRect(left + 18, top + 22, zone.width - 36, 20);
            graphics.fillStyle(0xfff3d5, 0.9);
            for (let x = left + 18; x < left + zone.width - 22; x += 28) {
              graphics.fillRect(x, top + 22, 14, 20);
            }
            graphics.fillStyle(0xd8b86a, 0.94);
            graphics.fillRoundedRect(left + 42, top + 10, zone.width - 84, 24, 6);
            graphics.fillStyle(0x231913, 0.88);
            graphics.fillRect(left + 44, top + 56, zone.width - 88, 22);
            return;
          }

          if (zone.kind === "ghost") {
            this.add.circle(centerX, centerY, 48, 0x5ac8ff, 0.22).setDepth(7);
            this.add.ellipse(centerX, centerY, 42, 54, 0xc7f2ff, 0.75).setDepth(8);
            this.add.circle(centerX - 9, centerY - 7, 3, 0x4a3f64).setDepth(10);
            this.add.circle(centerX + 9, centerY - 7, 3, 0x4a3f64).setDepth(10);
            this.add.rectangle(centerX, centerY + 12, 28, 4, 0x7b6fa0).setDepth(10);
            this.add.rectangle(centerX + 68, centerY - 22, 112, 30, 0x071225, 0.9).setDepth(11);
            this.add.text(centerX + 68, centerY - 29, "Ghost Sommelier", {
              align: "center",
              color: "#70b8ff",
              fontFamily: "system-ui, sans-serif",
              fontSize: "12px",
              fontStyle: "800"
            }).setOrigin(0.5).setDepth(12);
          }
        }

        private updateActiveZone() {
          const activeZone = findZoneAtPoint(this.player.x, this.player.y);
          const nextZoneId = activeZone?.id ?? null;
          if (nextZoneId === this.activeZoneId) {
            return;
          }

          if (this.activeZoneId) {
            const previousZone = INTERACTION_ZONES.find(
              (zone) => zone.id === this.activeZoneId
            );
            this.zoneGraphics
              .get(this.activeZoneId)
              ?.setFillStyle(previousZone?.fill ?? 0x211d18, 0.025)
              ?.setStrokeStyle(1, previousZone?.stroke ?? 0x211d18, 0.16)
              .setAlpha(1);
          }

          this.activeZoneId = nextZoneId;

          if (activeZone) {
            this.zoneGraphics
              .get(activeZone.id)
              ?.setFillStyle(0xc7a35d, 0.08)
              ?.setStrokeStyle(4, 0xc7a35d, 0.72)
              .setAlpha(1);
            this.promptText.setText(activeZone.prompt);
            this.promptText.setVisible(true);
            return;
          }

          this.promptText.setText("");
          this.promptText.setVisible(false);
        }

        private interactWithActiveZone() {
          if (!this.activeZoneId) {
            return;
          }

          onInteractRef.current(this.activeZoneId);
        }
      }

      game = new PhaserRuntime.Game({
        type: PhaserRuntime.AUTO,
        parent: mountRef.current,
        width: MAP_WIDTH,
        height: MAP_HEIGHT,
        backgroundColor: "#f0e5ce",
        scale: {
          mode: PhaserRuntime.Scale.FIT,
          autoCenter: PhaserRuntime.Scale.CENTER_BOTH,
          width: MAP_WIDTH,
          height: MAP_HEIGHT
        },
        scene: ChateauMapScene
      });
    }

    void bootPhaser();

    return () => {
      destroyed = true;
      clearInteractHandler?.();
      game?.destroy(true);
      if (mountRef.current) {
        mountRef.current.replaceChildren();
      }
    };
  }, []);

  const updateJoystick = useCallback((clientX: number, clientY: number) => {
    const pad = document.querySelector<HTMLDivElement>("[data-joystick-pad]");
    if (!pad) {
      return;
    }

    const rect = pad.getBoundingClientRect();
    const rawX = clientX - (rect.left + rect.width / 2);
    const rawY = clientY - (rect.top + rect.height / 2);
    const magnitude = Math.hypot(rawX, rawY);
    const scale = magnitude > JOYSTICK_RADIUS ? JOYSTICK_RADIUS / magnitude : 1;
    const visual = {
      x: rawX * scale,
      y: rawY * scale
    };

    setJoystickVisual(visual);
    mobileInputRef.current = {
      x: visual.x / JOYSTICK_RADIUS,
      y: visual.y / JOYSTICK_RADIUS
    };
  }, []);

  const resetJoystick = useCallback(() => {
    setJoystickVisual({ x: 0, y: 0 });
    mobileInputRef.current = { x: 0, y: 0 };
  }, []);

  return (
    <section className="map-panel" aria-label="Chateau map">
      <div className="map-canvas-shell" ref={mountRef} />
      <div className="mobile-controls" aria-label="Mobile controls">
        <div
          className="joystick-pad"
          data-joystick-pad
          onPointerCancel={resetJoystick}
          onPointerDown={(event) => {
            event.currentTarget.setPointerCapture(event.pointerId);
            updateJoystick(event.clientX, event.clientY);
          }}
          onPointerMove={(event) => {
            if (event.currentTarget.hasPointerCapture(event.pointerId)) {
              updateJoystick(event.clientX, event.clientY);
            }
          }}
          onPointerUp={(event) => {
            event.currentTarget.releasePointerCapture(event.pointerId);
            resetJoystick();
          }}
          role="application"
          tabIndex={0}
        >
          <span
            className="joystick-thumb"
            style={{
              transform: `translate(${joystickVisual.x}px, ${joystickVisual.y}px)`
            }}
          />
        </div>
        <button
          className="interact-button"
          type="button"
          onClick={() => {
            interactRef.current?.();
          }}
        >
          Interact
        </button>
      </div>
    </section>
  );
}
