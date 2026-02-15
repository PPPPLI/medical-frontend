import { Pipe, PipeTransform } from '@angular/core';
import {SurveyDto } from '../../model/models';

@Pipe({
  name: 'toSurveyDto',
  standalone: true
})
export class ToSurveyDtoPipe implements PipeTransform {

  transform(value: unknown): Array<SurveyDto> {
    return Array.isArray(value) ? (value as SurveyDto[]) : [];
  }

}
