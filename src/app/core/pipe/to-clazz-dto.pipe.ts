import { Pipe, PipeTransform } from '@angular/core';
import { ClazzDto } from '../../model/models';

@Pipe({ name: 'toClazzDto', standalone: true })
export class ToClazzDtoPipe implements PipeTransform {
  transform(value: unknown): ClazzDto[] {
    return Array.isArray(value) ? (value as ClazzDto[]) : [];
  }
}