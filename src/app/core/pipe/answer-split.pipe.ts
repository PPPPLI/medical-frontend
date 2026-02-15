import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'answerSplit', standalone: true })
export class AnswserSplitPipe implements PipeTransform {
    transform(value: string): Array<string> {

        if(value){

            return value.split(",");
        }
        return [];
    }
}