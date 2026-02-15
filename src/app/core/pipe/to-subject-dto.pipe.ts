import { Pipe, PipeTransform } from '@angular/core';
import { SubjectDto } from '../../model/models';

@Pipe({
  name: 'toSubjectDto',
  standalone: true
})
export class ToSubjectDtoPipe implements PipeTransform {

  transform(value: unknown): Array<SubjectDto> {
    return Array.isArray(value) ? (value as SubjectDto[]) : [];
  }

}
