import { Entity, Column, PrimaryColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Station } from './station.entity';

@Entity('historico')
export class PriceHistory {
  @PrimaryColumn({ type: 'date' })
  fecha: string;

  @Column({ type: 'json' })
  datos: any;

  /*
  @ManyToOne(() => Station, (station) => station.history)
  @JoinColumn({ name: 'id_ss' })
  station: Station;
  */
}
