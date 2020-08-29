class Source {
    constructor(imageData){
        this.imageData = imageData;
        this.borderData = this.getBorderData();
    }

    get width(){
        return this.imageData.width;
    }
    get height(){
        return this.imageData.height;
    }
    get data(){
        return this.imageData.data;
    }

    getBorderData(){
        let uint8 = new Uint8ClampedArray(this.data);
        for(let y = 0; y < this.height; y ++){
            for(let x = 0; x < this.width; x ++){
                if(this.isBorderedPixel(x, y)){
                    let i = x * 4 + y * 4 * this.width;
                    uint8[i] = 255;
                    uint8[i+1] = 32;
                    uint8[i+2] = 32;
                    uint8[i+3] = 255;
                }
            }
        }

        return new ImageData( uint8, this.width, this.height );
    }

    getColor(x, y){
        x = parseInt(x);
        y = parseInt(y);
        if(0 <= x && x < this.width && 0 <= y && y < this.height){
            let i = x * 4 + y * 4 * this.width;
            let r = this.data[i];
            let g = this.data[i+1];
            let b = this.data[i+2];
            let a = this.data[i+3];
            return r + g + b + a !== 0 ? [r,g,b,a] : null;
        } else return null;
    }

    setColor(x, y, [r,g,b,a]){
        x = parseInt(x);
        y = parseInt(y);
        if(0 <= x && x < this.width && 0 <= y && y < this.height){
            let i = x * 4 + y * 4 * this.width;
            this.data[i] = r;
            this.data[i+1] = g;
            this.data[i+2] = b;
            this.data[i+3] = a;
        }
    }

    isBorderedPixel(x, y){
        return this.getColor(x, y) &&
         ( !this.getColor(x-1, y)
        || !this.getColor(x+1, y)
        || !this.getColor(x, y-1)
        || !this.getColor(x, y+1))
    }

    isSlicedPixel(x, y){
        let left = this.getColor(x-1, y);
        let right = this.getColor(x+1, y);
        let top = this.getColor(x, y-1);
        let bottom = this.getColor(x, y+1);
        return (left || right || top || bottom) && !(left && right && top && bottom);
    }

    getSize(){
        let left = this.width;
        let top = this.height;
        let right = 0;
        let bottom = 0;
        for(let y = 0; y < this.height; y++){
            for(let x = 0; x < this.width; x++){
                if(this.getColor(x, y)){
                    left = Math.min(left, x);
                    right = Math.max(right, x);
                    top = Math.min(top, y);
                    bottom = Math.max(bottom, y);
                }
            }
        }
        return [left, top, right - left + 1, bottom - top + 1];
    }
}