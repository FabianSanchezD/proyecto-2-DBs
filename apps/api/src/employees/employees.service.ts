import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';

@Injectable()
export class EmployeesService {
  constructor(private readonly database: DatabaseService) {}

  async listPuestos() {
    const rows = await this.database.runPuestoList();
    return { items: rows };
  }

  async list(filter: string, userId: number, clientIp: string) {
    const result = await this.database.runEmpleadoList(filter, userId, clientIp);
    if (result.resultCode !== 0) {
      const message = await this.database.getErrorDescription(result.resultCode);
      throw new HttpException({ resultCode: result.resultCode, message }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
    return { items: result.items };
  }

  async getById(id: number) {
    const result = await this.database.runEmpleadoGetById(id);
    if (result.resultCode !== 0 || !result.item) {
      throw new HttpException({ resultCode: 50008, message: 'Empleado no encontrado.' }, HttpStatus.NOT_FOUND);
    }
    return result.item;
  }

  async create(dto: CreateEmployeeDto, userId: number, clientIp: string) {
    const code = await this.database.runEmpleadoInsert(
      dto.valorDocumentoIdentidad.trim(),
      dto.nombre.trim(),
      dto.idPuesto,
      dto.fechaContratacion,
      userId,
      clientIp,
    );
    if (code !== 0) {
      const message = await this.database.getErrorDescription(code);
      throw new HttpException({ resultCode: code, message }, HttpStatus.UNPROCESSABLE_ENTITY);
    }
    return { resultCode: 0 };
  }

  async update(id: number, dto: UpdateEmployeeDto, userId: number, clientIp: string) {
    const code = await this.database.runEmpleadoUpdate(
      id,
      dto.valorDocumentoIdentidad.trim(),
      dto.nombre.trim(),
      dto.idPuesto,
      userId,
      clientIp,
    );
    if (code !== 0) {
      const message = await this.database.getErrorDescription(code);
      throw new HttpException({ resultCode: code, message }, HttpStatus.UNPROCESSABLE_ENTITY);
    }
    return { resultCode: 0 };
  }

  async logDeleteAttempt(id: number, userId: number, clientIp: string) {
    const code = await this.database.runEmpleadoLogDeleteAttempt(id, userId, clientIp);
    if (code !== 0) {
      const message = await this.database.getErrorDescription(code);
      throw new HttpException({ resultCode: code, message }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
    return { resultCode: 0 };
  }

  async remove(id: number, userId: number, clientIp: string) {
    const code = await this.database.runEmpleadoDelete(id, userId, clientIp);
    if (code !== 0) {
      const message = await this.database.getErrorDescription(code);
      throw new HttpException({ resultCode: code, message }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
    return { resultCode: 0 };
  }
}
