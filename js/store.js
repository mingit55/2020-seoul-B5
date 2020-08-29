class App {
    constructor(){
        new IDB("seoul", ["papers", "inventory"], async db => {
            this.db = db;
            this.papers = await this.getPapers();
            this.cartList = [];

            let tags = this.papers.reduce((p, c) => [...p, ...c.hash_tags], []);
            this.searchModule = new HashModule("#search-area", tags);
            this.addModule = new HashModule("#add-tags", tags);

            this.searchTags = [];


            this.updateStore();
            this.updateCart();
            this.setEvents();
        });
    }

    get totalPoint(){
        return this.cartList.reduce((p, c) => p + c.totalPoint, 0);
    }

    get totalCount(){
        return this.cartList.reduce((p, c) => p + c.buyCount, 0);
    }


    async getPapers(){
        let papers = await this.db.getAll("papers");

        if(papers.length == 0){
            papers = (await ( fetch("/json/papers.json").then(res => res.json()) ))
                .map(paper => ({
                    ...paper,
                    id: parseInt(paper.id)   ,
                    width_size: parseInt(paper.width_size.replace(/[^0-9]/g, "")),
                    height_size: parseInt(paper.height_size.replace(/[^0-9]/g, "")),
                    point: parseInt(paper.point.replace(/[^0-9]/g, "")),
                    image: "/images/papers/" + paper.image,
                    hash_tags: paper.hash_tags.map(tag => tag.substr(1))
                }));
            
            papers.forEach(paper => {
                this.db.add("papers", paper);
            });
        }
        return papers.map(paper => new Paper(paper));
    }
    

    updateStore(){
        let viewList = this.papers;
        
        if(this.searchTags.length > 0){
            viewList = viewList.filter(viewItem => this.searchTags.every(tag => viewItem.hash_tags.includes(tag)));
        }
        
        $("#store").html("");
        viewList.forEach(viewItem => {
            viewItem.updateStore();
            $("#store").append( viewItem.$storeElem );
        });
    }

    updateCart(){
        let viewList = this.cartList;

        $("#cart").html("");
        viewList.forEach(viewItem => {
            viewItem.updateCart();
            $("#cart").append( viewItem.$cartElem );
        });

        $("#total-point").text(this.totalPoint);
        $("#cartList").val(JSON.stringify(this.cartList.map(item => ({id: item.id, count: item.buyCount}))));
        $("#totalPoint").val(this.totalPoint);
        $("#totalCount").val(this.totalCount);
    }

    setEvents(){
        $("#image").on("change", e => {
            if(e.target.files.length === 0) return;
            let file = e.target.files[0];

            if(file.size > 1024 * 1024 * 5){
                alert("이미지의 용량은 5MB를 넘을 수 없습니다.")
                e.target.value = "";
                return;
            } 
            if(!["jpg", "png", "gif"].includes(file.name.substr(-3).toLowerCase())){
                alert("이미지는 jpg, png, gif만 업로드 가능합니다.")
                e.target.value = "";
                return;
            }

            let reader = new FileReader();
            reader.onload = () => {
                $("#base64").val(reader.result);
            };
            reader.readAsDataURL(file);
        });
        
        $("#add-modal").on("submit", async e => {
            e.preventDefault();

            let inputs = Array.from($("#add-modal input[name]")).reduce((p, c) => {
                p[c.name] = c.value;
                return p;
            }, {});

            let paper = {
                ...inputs,
                width_size: parseInt(inputs.width_size),
                height_size: parseInt(inputs.height_size),
                point: parseInt(inputs.point),
                hash_tags: JSON.parse(inputs.hash_tags)
            };

            paper.id = await this.db.add("papers", paper);
            
            paper.hash_tags.forEach(tag => {
                if(!this.searchModule.hasList.includes(tag)) this.searchModule.hasList.push(tag);
                if(!this.addModule.hasList.includes(tag)) this.addModule.hasList.push(tag);
            });


            this.papers.push( new Paper(paper) );
            this.updateStore();
            $("#add-modal").modal("hide");

            alert("추가되었습니다.");
        });

        $("#store").on("click", ".btn-add", e => {
            let paper = this.papers.find(paper => paper.id == e.currentTarget.dataset.id);
            paper.buyCount++;
            
            if(this.cartList.includes(paper) == false) {
                this.cartList.push(paper);
            }

            this.updateStore();
            this.updateCart();
        });

        $("#cart").on("input", ".buy-count", e => {
            let value = parseInt(e.target.value);
            if(isNaN(value) || !value || value < 1) value = 1;
            else if(value > 1000) value = 1000;
            e.target.value = value;

            let paper = this.cartList.find(paper => paper.id == e.currentTarget.dataset.id);
            paper.buyCount = value;
            
            this.updateStore();
            this.updateCart();
            
            e.target.focus();
        });

        $("#cart").on("click", ".btn-remove", e => {
            let paper = this.cartList.find(paper => paper.id == e.currentTarget.dataset.id);
            paper.buyCount = 0;
            this.cartList = this.cartList.filter(cartItem => cartItem !== paper);
            this.updateStore();
            this.updateCart();
        });

        $("#buy-form").on("submit", async e => {
            e.preventDefault();

            alert(`총 ${this.totalCount}개의 한지가 구매되었습니다.`);

            await Promise.all(this.cartList.map(async cartItem => {
                let exist = await this.db.get("inventory", cartItem.id);
                
                if(exist){
                    exist.count += cartItem.buyCount;
                    await this.db.put("inventory", exist);
                } else {
                    await this.db.add("inventory", {
                        id: cartItem.id,
                        paper_name: cartItem.paper_name,
                        width_size: cartItem.width_size,
                        height_size: cartItem.height_size,
                        count: cartItem.buyCount,
                        image: cartItem.image,
                    });
                }
                cartItem.buyCount = 0;
            }));
            this.cartList = [];
            
            this.updateStore();
            this.updateCart();
        });

        $("#btn-search").on("click", e => {
            this.searchTags = this.searchModule.tags;
            this.updateStore();
        });
    }
}

class Paper {
    constructor({id, image, paper_name, company_name, width_size, height_size, point, hash_tags}){
        this.id = id;
        this.image = image;
        this.paper_name = paper_name;
        this.company_name = company_name;
        this.width_size = width_size;
        this.height_size = height_size;
        this.point = point;
        this.hash_tags = hash_tags;
        this.buyCount = 0;

        this.$storeElem = $(` <div class="col-lg-3 mb-4">
                                <div class="bg-white border">
                                    <img src="${image}" alt="이미지" class="fit-cover hx-200">
                                    <div class="p-3 border-top">
                                        <div class="fx-2">${paper_name}</div>
                                        <div class="mt-2">
                                            <span class="fx-n2 text-muted">업체명</span>
                                            <span class="fx-n1 ml-2">${company_name}</span>
                                        </div>
                                        <div class="mt-2">
                                            <span class="fx-n2 text-muted">사이즈</span>
                                            <span class="fx-n1 ml-2">${width_size}px × ${height_size}px</span>
                                        </div>
                                        <div class="mt-2">
                                            <span class="fx-n2 text-muted">포인트</span>
                                            <span class="fx-n1 ml-2">${point}p</span>
                                        </div>
                                        <div class="mt-2 text-muted fx-n2 d-flex flex-wrap">
                                            ${ hash_tags.map(tag => `<span class="m-1">#${tag}</span>`).join("") }
                                        </div>
                                        <button class="btn-add btn-filled mt-2" data-id="${id}">구매하기</button>
                                    </div>
                                </div>
                            </div>`);
        this.$cartElem = $(`<div class="t-row">
                                <div class="cell-50">
                                    <div class="align-center">
                                        <img src="${image}" alt="이미지" width="80" height="80">
                                        <div class="text-left ml-3">
                                            <div>
                                                <span class="fx-3">${paper_name}</span>
                                                <span class="badge badge-primary">${point}p</span>
                                            </div>
                                            <div class="fx-n1 text-muted">${company_name}</div>
                                        </div>
                                    </div>
                                </div>
                                <div class="cell-20">
                                    <input type="number" class="buy-count" min="1" value="${this.buyCount}" data-id="${id}">
                                </div>
                                <div class="cell-20 total">
                                    ${this.totalPoint}p
                                </div>
                                <div class="cell-10">
                                    <button class="btn-bordered btn-remove" data-id="${id}">삭제</button>
                                </div>
                            </div>`);
    }

    get totalPoint(){
        return this.buyCount * this.point;
    }

    updateStore(){
        this.$storeElem.find(".btn-add").text( this.buyCount > 0 ? `추가하기(${this.buyCount}개)` : "구매하기" );
    }

    updateCart(){
        this.$cartElem.find(".buy-count").val(this.buyCount);
        this.$cartElem.find(".total").text(this.totalPoint + "p");
    }
}

$(function(){
    let app = new App();
});