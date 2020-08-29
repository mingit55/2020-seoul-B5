class IDB {
    constructor(dbname, stores = [], callback = () => {}){
        let req = indexedDB.open(dbname, 1);
        req.onupgradeneeded = () => {
            let db = req.result;
            stores.forEach(store => {
                db.createObjectStore(store, {keyPath: "id", autoIncrement: true});
            });
        };
        req.onsuccess = () => {
            this.db = req.result;
            callback(this);
        };
    }

    objectStore(storeName){
        return this.db.transaction(storeName, "readwrite").objectStore(storeName);
    }

    get(storeName, id){
        return new Promise(res => {
            let os = this.objectStore(storeName);
            let req = os.get(id);
            req.onsuccess = () => res(req.result);
        });
    }

    getAll(storeName){
        return new Promise(res => {
            let os = this.objectStore(storeName);
            let req = os.getAll();
            req.onsuccess = () => res(req.result);
        });
    }

    add(storeName, data){
        return new Promise(res => {
            let os = this.objectStore(storeName);
            let req = os.add(data);
            req.onsuccess = () => res(req.result);
        });
    }

    put(storeName, data){
        return new Promise(res => {
            let os = this.objectStore(storeName);
            let req = os.put(data);
            req.onsuccess = () => res(req.result);
        });
    }

    delete(storeName, id){
        return new Promise(res => {
            let os = this.objectStore(storeName);
            let req = os.delete(id);
            req.onsuccess = () => res(req.result);
        });
    }
}

class HashModule {
    constructor(selecter, list = []){
        this.$root = $(selecter);
        this.name = this.$root.data("name");
        this.hasList = [];
        this.showList = [];
        this.tags = [];
        this.focusIdx = null;

        list.forEach(item => {
            if(!this.hasList.includes(item)){
                this.hasList.push(item);
            }
        });

        this.init();
        this.setEvents();
    }

    get focusItem(){
        return this.showList[this.focusIdx];
    }

    init(){
        this.$root.html(`<div class="hash-module">
                            <input type="hidden" name="${this.name}" value="[]">
                            <div class="hash-module__input">
                                # <input type="text">
                                <div class="example-list"></div>
                            </div>
                        </div>
                        <div class="error fx-n2 text-red mt-2"></div>`);       
        this.$list = this.$root.find(".example-list");
        this.$value = this.$root.find(".hash-module > input");
        this.$input = this.$root.find(".hash-module__input > input");
        this.$container = this.$root.find(".hash-module");
        this.$error = this.$root.find(".error");
    }

    update(){
        this.$list.html("");
        this.showList.forEach((item, idx) => {
            this.$list.append(`<div class="example-list__item ${idx === this.focusIdx ? "active" : ""}" data-idx="${idx}">#${item}</div>`);
        });

        this.$container.find(".hash-module__item").remove();
        this.tags.forEach((tag, idx) => {
            this.$container.append(`<div class="hash-module__item">#${tag}<span class="remove" data-idx="${idx}">×</span></div>`);
        });

        this.$value.val( JSON.stringify(this.tags) );
    }

    pushTag(tagname){
        if(!tagname || tagname.length < 2 || 30 < tagname.length) return;
        if(this.tags.length >= 10) {
            this.$error.text("태그는 10개까지만 추가할 수 있습니다.");
            return;
        }
        if(this.tags.includes(tagname)) {
            this.$error.text("이미 추가한 태그입니다.");
            return;
        }

        this.tags.push(tagname);
        this.focusIdx = null;
        this.showList = [];
        this.$input.val("");
    }

    setEvents(){
        this.$input.on("input", e => {
            e.target.value = e.target.value.replace(/[^0-9a-zA-Zㄱ-ㅎㅏ-ㅣ가-힣_]/g, "").substr(0, 30);
            this.focusIdx = null;
            this.$error.text("");
            
            if(e.target.value){
                let regex = new RegExp("^" + e.target.value.replace(/[.+*?^$\(\)\[\]\\\\\\/]/g, "\\$1"));
                this.showList = this.hasList.filter(item => regex.test(item));
            } else this.showList = [];

            this.update();
        });

        this.$input.on("keydown", e => {
            //focus & enter
            if(this.focusIdx !== null && e.keyCode === 13){
                e.preventDefault();
                this.pushTag(this.focusItem);
            }
            //spacebar, enter, tab
            else if([32, 13, 9].includes(e.keyCode)){
                e.preventDefault();
                this.pushTag( this.$input.val() );
            }
            // up
            else if(e.keyCode === 38){
                e.preventDefault();
                this.focusIdx = this.focusIdx === null ? this.showList.length - 1
                    : this.focusIdx - 1 < 0 ? this.showList.length - 1
                    : this.focusIdx - 1;
            }
            // down
            else if(e.keyCode === 40){
                e.preventDefault();
                this.focusIdx = this.focusIdx === null ? 0
                : this.focusIdx + 1 >= this.showList.length ? 0
                : this.focusIdx + 1;
            }

            this.update();
        });

        this.$list.on("click", ".example-list__item", e => {
            this.focusIdx = parseInt(e.currentTarget.dataset.idx);
            this.$input.focus();
            this.update();
        });

        this.$container.on("click", ".remove", e => {
            let idx = parseInt(e.currentTarget.dataset.idx);
            this.update();
            this.tags.splice(idx, 1);
        });

        // this.$input.on("blur", e => {
        //     this.focusIdx = null;
        //     this.showList = [];
        //     this.update();
        // });
    }
}