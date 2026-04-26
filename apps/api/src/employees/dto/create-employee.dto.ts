import { IsDateString, IsInt, IsNotEmpty, IsString, Min } from 'class-validator';

export class CreateEmployeeDto {
  @IsString()
  @IsNotEmpty()
  valorDocumentoIdentidad: string;

  @IsString()
  @IsNotEmpty()
  nombre: string;

  @IsInt()
  @Min(1)
  idPuesto: number;

  @IsDateString()
  fechaContratacion: string;
}
