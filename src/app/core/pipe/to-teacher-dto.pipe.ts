import { Pipe, PipeTransform } from '@angular/core';
import { TeacherDto } from '../../model/models';

@Pipe({
  name: 'toTeacherDto',
  standalone: true
})
export class ToTeacherDtoPipe implements PipeTransform {

  transform(value: unknown): Array<TeacherDto> {
    return Array.isArray(value) ? (value as TeacherDto[]) : [];
  }

}
