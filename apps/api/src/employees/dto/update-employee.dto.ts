import { IsInt, IsNotEmpty, IsString, Min } from 'class-validator';

export class UpdateEmployeeDto {
  @IsString()
  @IsNotEmpty()
  valorDocumentoIdentidad: string;

  @IsString()
  @IsNotEmpty()
  nombre: string;

  @IsInt()
  @Min(1)
  idPuesto: number;
}
