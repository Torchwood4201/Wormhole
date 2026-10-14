/**
 * Necronomicon horror props: primitive-built set dressing from the Seam's
 * script — skull piles, deadite heads, dagger altar, dead trees, reaching
 * hands, eye-stalks, winged idol, chains, flesh growth. Decorative and
 * non-collidable; place clear of walk lines. Only sway animation.
 */
import {
  BoxGeometry, CapsuleGeometry, CircleGeometry, ConeGeometry, CylinderGeometry,
  Group, Mesh, MeshBasicMaterial, MeshStandardMaterial, Scene, SphereGeometry,
  TorusGeometry, Vector3,
} from 'three';
import { mulberry32 } from '../../textures/TextureFactory';
import { dirVector } from '../Level';
import type { LevelElement } from '../Level';
import type { Dir, PropKind } from '../LevelData';

const bone = new MeshStandardMaterial({ color: 0xd8cfb8, roughness: 0.8 });
const boneDark = new MeshStandardMaterial({ color: 0x9a917c, roughness: 0.9 });
const flesh = new MeshStandardMaterial({ color: 0x4a1414, roughness: 1 });
const fleshDark = new MeshStandardMaterial({ color: 0x2a0b0b, roughness: 1 });
const bark = new MeshStandardMaterial({ color: 0x0d0b0a, roughness: 1 });
const stone = new MeshStandardMaterial({ color: 0x5a5c5e, roughness: 0.95 });
const iron = new MeshStandardMaterial({ color: 0x3a3d40, roughness: 0.5, metalness: 0.7 });
const blade = new MeshStandardMaterial({ color: 0x8a8d90, roughness: 0.35, metalness: 0.8 });
const rotPale = new MeshStandardMaterial({ color: 0xb9c0b0, roughness: 0.9 });
const pit = new MeshBasicMaterial({ color: 0x0a0a0a });
const eyeWhite = new MeshBasicMaterial({ color: 0xcfc8b0 });
const blood = new MeshBasicMaterial({ color: 0x6a0d0d });

function skull(rng: () => number, s: number): Group {
  const g = new Group();
  const cranium = new Mesh(new SphereGeometry(0.11 * s, 10, 8), bone);
  cranium.scale.set(1, 1.15, 1.05);
  cranium.position.y = 0.12 * s;
  const jaw = new Mesh(new BoxGeometry(0.11 * s, 0.06 * s, 0.09 * s), boneDark);
  jaw.position.set(0, 0.02 * s, 0.07 * s);
  jaw.rotation.x = 0.15 + rng() * 0.4;
  g.add(cranium, jaw);
  for (const ex of [-0.04, 0.04]) {
    const eye = new Mesh(new SphereGeometry(0.028 * s, 6, 6), pit);
    eye.position.set(ex * s, 0.14 * s, 0.095 * s);
    g.add(eye);
  }
  return g;
}

function deaditeHead(rng: () => number): Group {
  const g = new Group();
  const mass = new Mesh(new SphereGeometry(0.14, 10, 8), rotPale);
  mass.scale.set(0.9, 1.2, 0.95);
  mass.position.y = 0.17;
  const jaw = new Mesh(new BoxGeometry(0.13, 0.05, 0.1), rotPale);
  jaw.position.set(0, 0.02, 0.08);
  jaw.rotation.x = 0.5 + rng() * 0.3; // hung open
  g.add(mass, jaw);
  for (const ex of [-0.05, 0.05]) {
    const eye = new Mesh(new SphereGeometry(0.032, 6, 6), eyeWhite);
    eye.position.set(ex, 0.2, 0.11);
    g.add(eye);
    const pupil = new Mesh(new SphereGeometry(0.011, 6, 6), pit);
    pupil.position.set(ex, 0.2, 0.138);
    g.add(pupil);
  }
  return g;
}

export class HorrorProp implements LevelElement {
  group = new Group();
  private t = 0;
  private sway: { o: Group; amp: number; speed: number; phase: number; axis: 'x' | 'z' }[] = [];

  constructor(
    public id: string,
    pos: [number, number, number],
    dir: Dir | undefined,
    public prop: PropKind,
    seed: number,
    private scene: Scene,
  ) {
    const rng = mulberry32(seed * 7919 + 13);
    const p = new Vector3(...pos);
    const inner = new Group();
    this.build(inner, rng);
    this.group.add(inner);
    this.group.position.copy(p);
    if (dir) {
      const n = dirVector(dir);
      this.group.lookAt(p.clone().addScaledVector(n, 2));
    }
    scene.add(this.group);
  }

  private addSway(o: Group, amp: number, speed: number, axis: 'x' | 'z' = 'x'): void {
    this.sway.push({ o, amp, speed, phase: Math.random() * 6.28, axis });
  }

  private build(root: Group, rng: () => number): void {
    switch (this.prop) {
      case 'skulls': {
        const n = 5 + Math.floor(rng() * 3);
        for (let i = 0; i < n; i++) {
          const s = skull(rng, 0.8 + rng() * 0.5);
          const a = rng() * Math.PI * 2;
          const r = rng() * 0.5;
          s.position.set(Math.cos(a) * r, 0, Math.sin(a) * r);
          s.rotation.y = rng() * Math.PI * 2;
          s.rotation.z = (rng() - 0.5) * 0.9;
          root.add(s);
        }
        break;
      }
      case 'heads': {
        const n = 2 + Math.floor(rng() * 2);
        for (let i = 0; i < n; i++) {
          const h = deaditeHead(rng);
          h.position.set((rng() - 0.5) * 1.1, 0, (rng() - 0.5) * 0.7);
          h.rotation.y = rng() * Math.PI * 2;
          root.add(h);
        }
        break;
      }
      case 'daggers': {
        const altar = new Mesh(new BoxGeometry(0.9, 0.5, 0.6), stone);
        altar.position.y = 0.25;
        root.add(altar);
        for (let i = 0; i < 4; i++) {
          const dg = new Group();
          const bl = new Mesh(new BoxGeometry(0.3, 0.015, 0.055), blade);
          const grip = new Mesh(new CylinderGeometry(0.02, 0.025, 0.16, 6), bark);
          grip.rotation.z = Math.PI / 2;
          grip.position.x = -0.22;
          dg.add(bl, grip);
          dg.position.set(-0.28 + (i % 2) * 0.55, 0.52, -0.12 + Math.floor(i / 2) * 0.26);
          dg.rotation.y = (rng() - 0.5) * 0.9;
          root.add(dg);
        }
        const stain = new Mesh(new CircleGeometry(0.32, 12), blood);
        stain.rotation.x = -Math.PI / 2;
        stain.position.set(0.1, 0.505, 0.05);
        root.add(stain);
        break;
      }
      case 'tree': {
        const trunk = new Mesh(new CylinderGeometry(0.14, 0.26, 2.6, 7), bark);
        trunk.position.y = 1.3;
        trunk.rotation.z = 0.08 + (rng() - 0.5) * 0.1;
        root.add(trunk);
        const branches = 3 + Math.floor(rng() * 3);
        for (let i = 0; i < branches; i++) {
          const len = 0.9 + rng() * 0.9;
          const b = new Mesh(new CylinderGeometry(0.03, 0.07, len, 5), bark);
          const a = rng() * Math.PI * 2;
          b.position.set(Math.cos(a) * 0.3, 1.9 + rng() * 0.7, Math.sin(a) * 0.3);
          b.rotation.set((rng() - 0.5) * 1.2, 0, 0.6 + rng() * 0.7);
          b.rotation.y = a;
          root.add(b);
        }
        break;
      }
      case 'hands': {
        for (let i = 0; i < 3; i++) {
          const arm = new Group();
          const limb = new Mesh(new CapsuleGeometry(0.06, 0.7, 3, 8), fleshDark);
          limb.position.z = 0.4;
          limb.rotation.x = Math.PI / 2;
          arm.add(limb);
          const palm = new Mesh(new SphereGeometry(0.08, 8, 6), flesh);
          palm.position.z = 0.8;
          arm.add(palm);
          for (let f = 0; f < 4; f++) {
            const claw = new Mesh(new ConeGeometry(0.022, 0.22, 5), boneDark);
            const fa = ((f - 1.5) / 1.5) * 0.5;
            claw.position.set(Math.sin(fa) * 0.09, Math.cos(fa) * 0.02, 0.95);
            claw.rotation.x = Math.PI / 2 + 0.3;
            claw.rotation.z = -fa * 0.6;
            arm.add(claw);
          }
          arm.position.set((i - 1) * 0.55 + (rng() - 0.5) * 0.2, 0.3 + rng() * 0.9, 0);
          arm.rotation.x = (rng() - 0.5) * 0.5;
          arm.rotation.y = (rng() - 0.5) * 0.6;
          root.add(arm);
          this.addSway(arm, 0.06, 0.7 + rng() * 0.5);
        }
        break;
      }
      case 'eyes': {
        for (let i = 0; i < 2; i++) {
          const hang = new Group();
          const stalk = new Mesh(new CylinderGeometry(0.035, 0.05, 0.8, 6), fleshDark);
          stalk.position.y = -0.4;
          const ball = new Mesh(new SphereGeometry(0.14, 12, 10), eyeWhite);
          ball.position.y = -0.9;
          ball.scale.set(1, 1.25, 1);
          const pupil = new Mesh(new SphereGeometry(0.05, 8, 8), pit);
          pupil.position.set(0, -0.9, 0.12);
          hang.add(stalk, ball, pupil);
          hang.position.set((i - 0.5) * 0.9, 0, (rng() - 0.5) * 0.4);
          root.add(hang);
          this.addSway(hang, 0.09, 0.5 + rng() * 0.4, 'z');
        }
        break;
      }
      case 'idol': {
        const plinth = new Mesh(new BoxGeometry(1.0, 0.4, 1.0), stone);
        plinth.position.y = 0.2;
        const body = new Mesh(new CapsuleGeometry(0.24, 1.1, 4, 10), stone);
        body.position.y = 1.25;
        const head = new Mesh(new SphereGeometry(0.17, 10, 8), stone);
        head.position.y = 2.1;
        head.scale.set(0.9, 1.15, 0.9);
        root.add(plinth, body, head);
        for (const ex of [-0.075, 0.075]) {
          const e = new Mesh(new SphereGeometry(0.042, 6, 6), blood);
          e.position.set(ex, 2.14, 0.14);
          root.add(e);
        }
        for (const sx of [-1, 1]) {
          const wing = new Mesh(new ConeGeometry(0.5, 1.7, 4), stone);
          wing.scale.z = 0.14;
          wing.position.set(sx * 0.62, 1.6, -0.18);
          wing.rotation.z = sx * -0.55;
          root.add(wing);
          const arm = new Mesh(new CapsuleGeometry(0.07, 0.8, 3, 8), stone);
          arm.position.set(sx * 0.55, 1.35, 0.1);
          arm.rotation.z = sx * 1.25;
          root.add(arm);
        }
        break;
      }
      case 'chains': {
        const links = 6;
        const strand = new Group();
        for (let i = 0; i < links; i++) {
          const link = new Mesh(new TorusGeometry(0.09, 0.022, 6, 10), iron);
          link.position.y = -i * 0.15;
          link.rotation.y = (i % 2) * Math.PI / 2;
          strand.add(link);
        }
        const hook = new Mesh(new ConeGeometry(0.05, 0.28, 6), iron);
        hook.position.y = -links * 0.15 - 0.1;
        hook.rotation.x = Math.PI;
        strand.add(hook);
        root.add(strand);
        this.addSway(strand, 0.07, 0.6 + rng() * 0.4, 'z');
        break;
      }
      case 'growth': {
        const blobs: [number, number, number, number][] = [
          [0, 0.3, 0, 0.55], [-0.5, 0.22, 0.1, 0.4], [0.5, 0.25, -0.05, 0.42],
        ];
        for (const [bx, by, bz, br] of blobs) {
          const m = new Mesh(new SphereGeometry(br, 10, 8), flesh);
          m.scale.y = 0.6;
          m.position.set(bx, by, bz);
          root.add(m);
        }
        for (let i = 0; i < 3; i++) {
          const s = skull(rng, 0.9);
          s.position.set((rng() - 0.5) * 0.9, 0.32, 0.25 + rng() * 0.15);
          s.rotation.x = -0.5;
          root.add(s);
        }
        break;
      }
    }
  }

  update(dt: number): void {
    if (this.sway.length === 0) return;
    this.t += dt;
    for (const s of this.sway) {
      const v = Math.sin(this.t * s.speed + s.phase) * s.amp;
      if (s.axis === 'x') s.o.rotation.x += v * dt;
      else s.o.rotation.z += v * dt;
    }
  }

  dispose(): void {
    this.scene.remove(this.group);
    this.group.traverse((o) => {
      if (o instanceof Mesh) o.geometry.dispose();
    });
  }
}
