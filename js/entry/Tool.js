class Tool {
    constructor(ws){
        this.ws = ws;
        this.selected = null;
    }

    getXY({pageX, pageY}){
        let {left, top} = $(this.ws.canvas).offset();
        let width = $(this.ws.canvas).width();
        let height = $(this.ws.canvas).height();
        
        let x = pageX - left;
        x = x < 0 ? 0 : x > width ? width : x;
        let y = pageY - top;
        y = y < 0 ? 0 : y > height ? height : y;

        return [x, y];
    }

    getMouseTarget(e){
        let [x, y] = this.getXY(e);
        
        for(let i = this.ws.parts.length - 1; i >= 0; i--){
            let part = this.ws.parts[i];
            
            if(part.src.getColor(x - part.x, y - part.y)){
                this.ws.parts.splice(i, 1);
                this.ws.parts.push(part);
                return part;
            }
        }
        return null;
    }

    getMouseTargetIndex(){
        
    }

    unselectAll(){
        this.ws.parts.forEach(part => part.active = false);
        this.selected = null;
    }
}