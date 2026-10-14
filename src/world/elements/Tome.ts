/**
 * Flesh-bound tome: Halloran's warning, bound in skin and teeth. Behaves like
 * a Terminal for the read path (pos / loreId / read / markRead) so E-to-read,
 * prompts, and subtitles work unchanged — see Interaction.ts / Game.ts.
 */
import {
  BoxGeometry, CanvasTexture, Group, Mesh, MeshStandardMaterial,
  PlaneGeometry, Scene, SRGBColorSpace, Vector3,
} from 'three';
import { tomeCoverTexture } from '../../textures/TextureFactory';
import { materials } from '../../textures/Materials';
import type { LevelElement } from '../Level';

const PAGE = new MeshStandardMaterial({ color: 0xcabfa4, roughness: 0.9 });

export class Tome implements LevelElement {
  group = new Group();
  readonly pos: Vector3;
  readonly loreId: string;
  read = false;
  private coverMat: MeshStandardMaterial;
  private tex: CanvasTexture;
  private pulseT = 0;

  constructor(
    public id: string,
    pos: [number, number, number],
    loreId: string,
    seed: number,
    private scene: Scene,
  ) {
    this.pos = new Vector3(...pos);
    this.loreId = loreId;

    // lectern
    const stand = new Mesh(new BoxGeometry(0.5, 1.0, 0.5), materials.get('metalDark'));
    stand.position.y = -0.56;
    // bottom cover + page block + faced top cover
    const bottom = new Mesh(new BoxGeometry(0.5, 0.03, 0.36), materials.get('metalDark'));
    bottom.position.y = -0.035;
    const pages = new Mesh(new BoxGeometry(0.44, 0.07, 0.3), PAGE);
    pages.position.y = 0.015;
    this.tex = tomeCoverTexture(seed);
    this.coverMat = new MeshStandardMaterial({
      map: this.tex, emissive: 0xffffff, emissiveMap: this.tex,
      emissiveIntensity: 0.28, roughness: 0.95,
    });
    const cover = new Mesh(new PlaneGeometry(0.5, 0.36), this.coverMat);
    cover.rotation.x = -Math.PI / 2;
    cover.rotation.z = Math.PI / 2;
    cover.position.y = 0.052;

    this.group.add(stand, bottom, pages, cover);
    this.group.position.copy(this.pos);
    this.group.rotation.y = 0.5;
    scene.add(this.group);
  }

  markRead(): void {
    if (this.read) return;
    this.read = true;
    this.coverMat.emissiveIntensity = 0.06;
  }

  update(dt: number): void {
    // bound skin breathes, faintly, until read
    this.pulseT += dt;
    if (!this.read) {
      this.coverMat.emissiveIntensity =
        0.26 + 0.06 * Math.sin(this.pulseT * 1.7) * Math.sin(this.pulseT * 0.6);
    }
  }

  dispose(): void {
    this.scene.remove(this.group);
    this.tex.dispose();
    this.coverMat.dispose();
    // geometries are per-instance; PAGE / metalDark materials are shared — keep
    this.group.traverse((o) => {
      if (o instanceof Mesh) o.geometry.dispose();
    });
  }
}
