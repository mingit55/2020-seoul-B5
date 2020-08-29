class Select extends Tool {
    constructor(){
        super(...arguments);
        this.mouseTarget = null;
    }

    onmousedown(e){
        let target = this.getMouseTarget(e);
        this.unselectAll();
        
        if(target){
            target.active = true;
            this.selected = target;
            this.mouseTarget = target;
            
            this.downXY = this.getXY(e);
            this.firstXY = [target.x, target.y];

        }
    }

    onmousemove(e){
        if(!this.mouseTarget) return;

        let [x, y] = this.getXY(e);
        let [fx, fy] = this.firstXY;
        let [dx, dy] = this.downXY;

        this.mouseTarget.x = fx + x - dx;
        this.mouseTarget.y = fy + y - dy;
    }

    onmouseup(e){
        this.mouseTarget = null;
    }
}