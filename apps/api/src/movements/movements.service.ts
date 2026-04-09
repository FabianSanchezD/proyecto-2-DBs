import { Injectable } from '@nestjs/common';

@Injectable()
export class MovementsService {
  listPlaceholder() {
    return { items: [], message: 'Movements module stub.' };
  }
}
