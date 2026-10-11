// Presentation clocks advance with rendering, including the super's simulation
// freeze; paused drawing supplies dt=0. Slots support simultaneous supers.
export class SuperEffects {
  constructor() { this.clear(); }
  clear() { this.ready = []; this.bursts = []; this.impacts = []; }
  event(e) {
    if (['round', 'roundEnd', 'selection'].includes(e.type)) this.clear();
    if (e.type === 'superReady') {
      this.ready = this.ready.filter(r => r.fighter !== e.fighter);
      this.ready.push({ ...e, age: 0, duration: .85 });
    }
    if (e.type === 'superStart') {
      this.ready = this.ready.filter(r => r.fighter !== e.fighter);
      this.bursts = this.bursts.filter(r => r.fighter !== e.fighter);
      this.bursts.push({ ...e, age: 0, duration: e.freeze + .30 });
    }
    if (e.type === 'hit' && e.move === 'super') this.impacts.push({ ...e, age: 0, duration: .20 });
  }
  update(dt) {
    for (const effects of [this.ready, this.bursts, this.impacts]) for (const fx of effects) fx.age += Math.max(0, dt);
    this.ready = this.ready.filter(fx => fx.age < fx.duration);
    this.bursts = this.bursts.filter(fx => fx.age < fx.duration);
    this.impacts = this.impacts.filter(fx => fx.age < fx.duration);
  }
}
