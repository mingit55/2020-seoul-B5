class Workspace {
    constructor(app){
        this.app = app;
        this.parts = [];

        this.canvas = document.querySelector(".workspace > canvas");
        this.ctx = this.canvas.getContext("2d");
        this.ctx.fillStyle = "#fff";

        this.sliced = document.createElement("canvas");
        this.sliced.width = this.canvas.width;
        this.sliced.height = this.canvas.height;
        
        this.selected = null;
        this.tools = {
            select: new Select(this),
            spin: new Spin(this),
            cut: new Cut(this),
            glue: new Glue(this)
        };

        this.render();
        this.setEvents();
    }

    get tool(){
        return this.tools[this.selected];
    }

    async addPart({image, width_size, height_size}){
        let imgObj = await new Promise(res => {
            let obj = new Image()
            obj.src = image;
            obj.onload = () => res(obj);
        });

        let canvas = document.createElement("canvas");
        canvas.width = width_size;
        canvas.height = height_size;
        let ctx = canvas.getContext("2d");
        ctx.drawImage(imgObj, 0, 0, width_size, height_size);

        let src = new Source(ctx.getImageData(0, 0, width_size, height_size));
        this.parts.push( new Part(src) );
    }

    render(){
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);       

        this.parts.forEach(part => {
            part.update();
            this.ctx.drawImage(part.canvas, part.x, part.y);
            // this.ctx.strokeRect(part.x, part.y, part.canvas.width, part.canvas.height);
        });

        this.ctx.drawImage(this.sliced, 0, 0);

        requestAnimationFrame(() => this.render());
    }


    setEvents(){
        $(window).on("mousedown", e => {
            if(this.tool && e.which == 1 && this.tool.onmousedown){
                e.preventDefault();
                this.tool.onmousedown(e);
            }
        });
        $(window).on("mousemove", e => {
            if(this.tool && e.which == 1 && this.tool.onmousemove){
                e.preventDefault();
                this.tool.onmousemove(e);
            }
        });
        $(window).on("mouseup", e => {
            if(this.tool && e.which == 1 && this.tool.onmouseup){
                e.preventDefault();
                this.tool.onmouseup(e);
            }
        });
        $(window).on("dblclick", e => {
            if(this.tool && e.which == 1 && this.tool.ondblclick){
                e.preventDefault();
                this.tool.ondblclick(e);
            }
        });
        $(window).on("contextmenu", e => {
            if(this.tool && this.tool.oncontextmenu){
                e.preventDefault();
                this.tool.oncontextmenu(menus => this.app.makeContextMenu(e.pageX, e.pageY, menus));
            }
        });
    }
}