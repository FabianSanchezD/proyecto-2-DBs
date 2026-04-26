import { IsDateString, IsInt, IsNumber, Min } from 'class-validator';

export class CreateMovementDto {
  @IsInt()
  @Min(1)
  empleadoId: number;

  @IsInt()
  @Min(1)
  idTipoMovimiento: number;

  @IsDateString()
  fecha: string;

  @IsNumber()
  @Min(0.01)
  monto: number;
}
