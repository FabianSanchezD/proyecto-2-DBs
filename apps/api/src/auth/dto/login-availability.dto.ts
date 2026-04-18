import { IsString, MaxLength, MinLength } from 'class-validator';

export class LoginAvailabilityDto {
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  username!: string;
}
