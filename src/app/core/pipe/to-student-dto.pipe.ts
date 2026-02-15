import { Pipe, PipeTransform } from '@angular/core';
import { StudentDto } from '../../model/models';

@Pipe({
  name: 'toStudentDto',
  standalone: true
})
export class ToStudentDtoPipe implements PipeTransform {

  transform(value: unknown): Array<StudentDto> {
    return Array.isArray(value) ? (value as StudentDto[]) : [];
  }

}
