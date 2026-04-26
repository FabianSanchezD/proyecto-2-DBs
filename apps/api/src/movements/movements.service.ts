import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreateMovementDto } from './dto/create-movement.dto';

@Injectable()
export class MovementsService {
  constructor(private readonly database: DatabaseService) {}

  async listTipos() {
    const rows = await this.database.runTipoMovimientoList();
    return { items: rows };
  }

  async list(empleadoId: number) {
    const result = await this.database.runMovimientoList(empleadoId);
    if (result.resultCode !== 0) {
      const message = await this.database.getErrorDescription(result.resultCode);
      throw new HttpException({ resultCode: result.resultCode, message }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
    return { items: result.items };
  }

  async create(dto: CreateMovementDto, userId: number, clientIp: string) {
    const code = await this.database.runMovimientoInsert(
      dto.empleadoId,
      dto.idTipoMovimiento,
      dto.fecha,
      dto.monto,
      userId,
      clientIp,
    );
    if (code !== 0) {
      const message = await this.database.getErrorDescription(code);
      throw new HttpException({ resultCode: code, message }, HttpStatus.UNPROCESSABLE_ENTITY);
    }
    return { resultCode: 0 };
  }
}
