"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  INTERACTION_ZONES,
  MAP_HEIGHT,
  MAP_PROMPT_Y,
  MAP_WIDTH,
  PLAYER_START,
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
const JOYSTICK_RADIUS = 42;

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
        private player!: Phaser.GameObjects.Arc;
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

        create() {
          this.drawGround();

          for (const zone of INTERACTION_ZONES) {
            this.drawZone(zone);
          }

          this.player = this.add
            .circle(PLAYER_START.x, PLAYER_START.y, PLAYER_RADIUS, 0x24523f)
            .setStrokeStyle(4, 0xfffaf0)
            .setDepth(20);

          this.promptText = this.add
            .text(MAP_WIDTH / 2, MAP_PROMPT_Y, "Walk into a zone", {
              align: "center",
              backgroundColor: "#2a171b",
              color: "#fff8e8",
              fontFamily: "system-ui, sans-serif",
              fontSize: "15px",
              fontStyle: "700",
              padding: {
                x: 14,
                y: 8
              }
            })
            .setOrigin(0.5)
            .setDepth(30);

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
          const graphics = this.add.graphics();
          graphics.fillStyle(0xf2e0bd, 1);
          graphics.fillRect(0, 0, MAP_WIDTH, MAP_HEIGHT);
          graphics.fillStyle(0x9bb47a, 0.42);
          graphics.fillRoundedRect(34, 32, MAP_WIDTH - 68, MAP_HEIGHT - 70, 24);
          graphics.fillStyle(0xe8d3a4, 0.7);
          graphics.fillRoundedRect(70, 238, 584, 28, 14);
          graphics.fillRoundedRect(350, 102, 28, 312, 14);
          graphics.lineStyle(2, 0x78965c, 0.24);
          for (let y = 52; y <= MAP_HEIGHT - 78; y += 26) {
            graphics.lineBetween(58, y, MAP_WIDTH - 58, y + 8);
          }
          graphics.fillStyle(0x6f8d56, 0.28);
          for (let x = 58; x <= MAP_WIDTH - 58; x += 46) {
            for (let y = 58; y <= MAP_HEIGHT - 78; y += 52) {
              graphics.fillCircle(x, y, 3);
            }
          }
        }

        private drawZone(zone: InteractionZone) {
          const rectangle = this.add
            .rectangle(zone.x, zone.y, zone.width, zone.height, zone.fill)
            .setStrokeStyle(2, zone.stroke)
            .setAlpha(0.9)
            .setDepth(5);
          this.zoneGraphics.set(zone.id, rectangle);
          this.drawZoneDecoration(zone);

          this.add
            .text(zone.x, zone.y + zone.height / 2 - 17, zone.shortLabel, {
              align: "center",
              color: "#211d18",
              fontFamily: "system-ui, sans-serif",
              fontSize: zone.kind === "ghost" ? "12px" : "13px",
              fontStyle: "800"
            })
            .setOrigin(0.5)
            .setDepth(12);
        }

        private drawZoneDecoration(zone: InteractionZone) {
          const left = zone.x - zone.width / 2;
          const top = zone.y - zone.height / 2;
          const centerX = zone.x;
          const centerY = zone.y - 2;

          if (zone.kind === "chateau") {
            this.add
              .triangle(centerX, top + 5, 0, 34, zone.width - 26, 34, (zone.width - 26) / 2, 0, 0x6f2c35)
              .setDepth(8);
            this.add.rectangle(centerX, centerY + 8, zone.width - 64, 28, 0xf6ead2).setDepth(9);
            this.add.rectangle(centerX, centerY + 16, 24, 18, 0x5a3728).setDepth(10);
            return;
          }

          if (zone.kind === "plot") {
            const graphics = this.add.graphics().setDepth(9);
            graphics.lineStyle(3, 0x3d6b39, 0.62);
            for (let offset = -20; offset <= 20; offset += 13) {
              graphics.lineBetween(left + 13, centerY + offset, left + zone.width - 13, centerY + offset + 6);
            }
            graphics.fillStyle(0x5f2a64, 0.7);
            for (let x = left + 22; x <= left + zone.width - 22; x += 23) {
              graphics.fillCircle(x, centerY - 2, 3);
            }
            return;
          }

          if (zone.kind === "cellar") {
            this.add.rectangle(centerX, centerY + 2, zone.width - 34, 28, 0x5b3327).setDepth(8);
            this.add.rectangle(centerX, centerY - 9, zone.width - 52, 8, 0x2e1b18).setDepth(9);
            this.add.rectangle(centerX - 24, centerY + 6, 16, 18, 0x8c5a3b).setDepth(9);
            this.add.rectangle(centerX + 24, centerY + 6, 16, 18, 0x8c5a3b).setDepth(9);
            return;
          }

          if (zone.kind === "production") {
            this.add.ellipse(centerX - 30, centerY + 4, 32, 38, 0xd8d1bd).setDepth(8);
            this.add.rectangle(centerX - 30, centerY + 4, 32, 28, 0xb9b19f).setDepth(9);
            this.add.circle(centerX + 28, centerY + 5, 20, 0x7f4a33).setDepth(8);
            this.add.rectangle(centerX + 28, centerY + 5, 38, 9, 0x5b2f25).setDepth(9);
            return;
          }

          if (zone.kind === "shop" || zone.kind === "market") {
            const graphics = this.add.graphics().setDepth(9);
            graphics.fillStyle(zone.kind === "shop" ? 0x7b2442 : 0x2f5f46, 0.95);
            graphics.fillRect(left + 16, top + 11, zone.width - 32, 14);
            graphics.fillStyle(0xfff3d5, 0.9);
            for (let x = left + 18; x < left + zone.width - 22; x += 24) {
              graphics.fillRect(x, top + 11, 12, 14);
            }
            graphics.fillStyle(0x4a3328, 0.7);
            graphics.fillRect(left + 24, centerY + 4, zone.width - 48, 16);
            return;
          }

          if (zone.kind === "ghost") {
            this.add.ellipse(centerX, centerY, 42, 54, 0xf7f1ff, 0.88).setDepth(8);
            this.add.circle(centerX - 9, centerY - 7, 3, 0x4a3f64).setDepth(10);
            this.add.circle(centerX + 9, centerY - 7, 3, 0x4a3f64).setDepth(10);
            this.add.rectangle(centerX, centerY + 12, 28, 4, 0x7b6fa0).setDepth(10);
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
              ?.setStrokeStyle(2, previousZone?.stroke ?? 0x211d18)
              .setAlpha(0.9);
          }

          this.activeZoneId = nextZoneId;

          if (activeZone) {
            this.zoneGraphics
              .get(activeZone.id)
              ?.setStrokeStyle(5, 0xc7a35d)
              .setAlpha(1);
            this.promptText.setText(activeZone.prompt);
            return;
          }

          this.promptText.setText("Walk into a zone");
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
