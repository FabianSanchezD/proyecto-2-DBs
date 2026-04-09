import { Injectable } from '@nestjs/common';

@Injectable()
export class EmployeesService {
  listPlaceholder() {
    return { items: [], message: 'No database logic yet — use stored procedures later.' };
  }
}
