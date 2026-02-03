import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Station } from '../entities/station.entity';
import { PriceHistory } from '../entities/price-history.entity';
import axios from 'axios';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class FuelService {
  private readonly logger = new Logger(FuelService.name);

  constructor(
    @InjectRepository(Station)
    private readonly stationRepository: Repository<Station>,
    @InjectRepository(PriceHistory)
    private readonly historyRepository: Repository<PriceHistory>,
    private readonly configService: ConfigService,
  ) {}

  async updateDataFromMinistry() {
    try {
      this.logger.log('Starting data update from Ministry...');
      const url = this.configService.get<string>('MINISTRY_API_URL') || '';
      if (!url) throw new Error('MINISTRY_API_URL not configured');
      
      const { data } = await axios.get(url);
      
      const listaEESS = data.ListaEESSPrecio;
      const stations: Station[] = [];
      const historyData: Record<number, number[]> = {};

      for (const eess of listaEESS) {
        const id = parseInt(eess['IDEESS']);
        const diesel = this.parsePrice(eess['Precio Gasoleo A']);
        const dieselExtra = this.parsePrice(eess['Precio Gasoleo Premium']);
        const gas95 = this.parsePrice(eess['Precio Gasolina 95 E5']);
        const gas98 = this.parsePrice(eess['Precio Gasolina 98 E5']);

        const station = this.stationRepository.create({
          id_ss: id,
          rotulo: eess['Rótulo'],
          horario: eess['Horario'],
          precio_diesel: diesel,
          precio_diesel_extra: dieselExtra,
          precio_gasolina_95: gas95,
          precio_gasolina_98: gas98,
          direccion: eess['Dirección'],
          provincia: eess['Provincia'],
          localidad: eess['Localidad'],
          cp: eess['C.P.'],
          longitud: eess['Longitud (WGS84)'],
          latitud: eess['Latitud'],
          fecha_actualizacion: new Date(),
        });

        stations.push(station);
        historyData[id] = [diesel, dieselExtra, gas95, gas98];
      }

      // Sync stations (Update or Insert)
      // Using save with chunks to avoid memory/packet size issues
      await this.stationRepository.save(stations, { chunk: 500 });
      this.logger.log(`Updated ${stations.length} stations.`);

      // Update History for today
      const today = new Date().toISOString().split('T')[0];
      await this.historyRepository.save({
        fecha: today,
        datos: historyData,
      });
      this.logger.log('Daily history updated.');

      return { success: true, count: stations.length };
    } catch (error) {
      this.logger.error('Error updating data:', error.message);
      throw error;
    }
  }

  private parsePrice(value: string): number {
    if (!value) return 0;
    return parseFloat(value.replace(',', '.'));
  }

  async findByLocation(query: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;
    const [data, total] = await this.stationRepository.createQueryBuilder('s')
      .where('s.localidad LIKE :query', { query: `%${query}%` })
      .orWhere('s.cp LIKE :query', { query: `%${query}%` })
      .orderBy('s.cp', 'ASC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return {
      data,
      meta: {
        total,
        page,
        lastPage: Math.ceil(total / limit),
      }
    };
  }

  async getStats(location: string) {
    const query = this.stationRepository.createQueryBuilder('s')
      .where('s.localidad LIKE :location', { location: `%${location}%` })
      .orWhere('s.cp LIKE :location', { location: `%${location}%` });

    const rawStats = await query
      .select([
        'AVG(s.precio_diesel) as avg_diesel',
        'MIN(s.precio_diesel) as min_diesel',
        'MAX(s.precio_diesel) as max_diesel',
        'AVG(s.precio_gasolina_95) as avg_gas95',
        'MIN(s.precio_gasolina_95) as min_gas95',
        'MAX(s.precio_gasolina_95) as max_gas95',
        'AVG(s.precio_diesel_extra) as avg_diesel_extra',
        'AVG(s.precio_gasolina_98) as avg_gas98',
      ])
      .getRawOne();

    return {
      diesel: {
        avg: parseFloat(rawStats.avg_diesel) || 0,
        min: parseFloat(rawStats.min_diesel) || 0,
        max: parseFloat(rawStats.max_diesel) || 0,
      },
      gas95: {
        avg: parseFloat(rawStats.avg_gas95) || 0,
        min: parseFloat(rawStats.min_gas95) || 0,
        max: parseFloat(rawStats.max_gas95) || 0,
      },
      diesel_extra: { avg: parseFloat(rawStats.avg_diesel_extra) || 0 },
      gas98: { avg: parseFloat(rawStats.avg_gas98) || 0 },
    };
  }
}
