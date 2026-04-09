import { Controller, Get } from '@nestjs/common';
import { ErrorsService } from './errors.service';

@Controller('errors')
export class ErrorsController {
  constructor(private readonly errorsService: ErrorsService) {}

  @Get()
  list() {
    return this.errorsService.listPlaceholder();
  }
}
