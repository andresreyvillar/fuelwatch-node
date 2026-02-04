import { Entity, Column, PrimaryColumn, OneToMany } from 'typeorm';
import { PriceHistory } from './price-history.entity';

@Entity('servicestations')
export class Station {
  @PrimaryColumn()
  id_ss: number;

  @Column()
  rotulo: string;

  @Column()
  horario: string;

  @Column({ type: 'float', nullable: true })
  precio_diesel: number;

  @Column({ type: 'float', nullable: true })
  precio_diesel_extra: number;

  @Column({ type: 'float', nullable: true })
  precio_gasolina_95: number;

  @Column({ type: 'float', nullable: true })
  precio_gasolina_98: number;

  @Column()
  direccion: string;

  @Column()
  provincia: string;

  @Column()
  localidad: string;

  @Column()
  cp: string;

  @Column()
  longitud: string;

  @Column()
  latitud: string;

  @Column({ type: 'timestamp' })
  fecha_actualizacion: Date;

  /*
  @OneToMany(() => PriceHistory, (history) => history.station)
  history: PriceHistory[];
  */
}
