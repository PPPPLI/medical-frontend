import { Pipe, PipeTransform } from '@angular/core';
import { ClazzDto } from '../../model/models';

@Pipe({ name: 'answer', standalone: true })
export class AnswserPipe implements PipeTransform {
    transform(value: string): string {

        if(value){
            return value.replaceAll(",", " | ");
        }
        return value;
    }
}