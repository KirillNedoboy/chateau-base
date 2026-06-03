"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  INTERACTION_ZONES,
  MAP_HEIGHT,
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
          this.add.rectangle(
            MAP_WIDTH / 2,
            MAP_HEIGHT / 2,
            MAP_WIDTH,
            MAP_HEIGHT,
            0xf0e5ce
          );
          this.add.rectangle(360, 250, 650, 350, 0xb9cf9b, 0.34);
          this.add.rectangle(360, 250, 600, 24, 0xe4d4af, 0.55);
          this.add.rectangle(360, 340, 540, 20, 0xe4d4af, 0.55);

          for (const zone of INTERACTION_ZONES) {
            const rectangle = this.add
              .rectangle(zone.x, zone.y, zone.width, zone.height, zone.fill)
              .setStrokeStyle(2, zone.stroke)
              .setAlpha(0.9);
            this.zoneGraphics.set(zone.id, rectangle);

            this.add
              .text(zone.x, zone.y, zone.label, {
                align: "center",
                color: "#211d18",
                fontFamily: "system-ui, sans-serif",
                fontSize: "15px",
                fontStyle: "700"
              })
              .setOrigin(0.5);
          }

          this.player = this.add
            .circle(PLAYER_START.x, PLAYER_START.y, PLAYER_RADIUS, 0x24523f)
            .setStrokeStyle(3, 0xfffaf0);

          this.promptText = this.add
            .text(MAP_WIDTH / 2, MAP_HEIGHT - 24, "Walk into a zone", {
              align: "center",
              backgroundColor: "#fffaf0",
              color: "#211d18",
              fontFamily: "system-ui, sans-serif",
              fontSize: "15px",
              padding: {
                x: 10,
                y: 6
              }
            })
            .setOrigin(0.5);

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

        private updateActiveZone() {
          const activeZone = findZoneAtPoint(this.player.x, this.player.y);
          const nextZoneId = activeZone?.id ?? null;
          if (nextZoneId === this.activeZoneId) {
            return;
          }

          if (this.activeZoneId) {
            this.zoneGraphics.get(this.activeZoneId)?.setStrokeStyle(
              2,
              INTERACTION_ZONES.find((zone) => zone.id === this.activeZoneId)
                ?.stroke ?? 0x211d18
            );
          }

          this.activeZoneId = nextZoneId;

          if (activeZone) {
            this.zoneGraphics.get(activeZone.id)?.setStrokeStyle(5, 0x24523f);
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
