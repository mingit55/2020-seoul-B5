class App {
    constructor(){
        this.helpers = [
            `선택 도구는 가장 기본적인 도구로써, 작업 영역 내의 한지를 선택할 수 있게 합니다. 마우스 클릭으로 한지를 활성화하여 이동시킬 수 있으며, 선택된 한지는 삭제 버튼으로 삭제시킬 수 있습니다.`,
            `회전 도구는 작업 영역 내의 한지를 회전할 수 있는 도구입니다. 마우스 더블 클릭으로 회전하고자 하는 한지를 선택하면, 좌우로 마우스를 끌어당겨 회전시킬 수 있습니다. 회전한 뒤에는 우 클릭의 콘텍스트 메뉴로 '확인'을 눌러 한지의 회전 상태를 작업 영역에 반영할 수 있습니다.`,
            `자르기 도구는 작업 영역 내의 한지를 자를 수 있는 도구입니다. 마우스 더블 클릭으로 자르고자 하는 한지를 선택하면 마우스를 움직임으로써 자르고자 하는 궤적을 그릴 수 있습니다. 궤적을 그린 뒤에는 우 클릭의 콘텍스트 메뉴로 '자르기'를 눌러 그려진 궤적에 따라 한지를 자를 수 있습니다.`,
            `붙이기 도구는 작업 영역 내의 한지들을 붙일 수 있는 도구입니다. 마우스 더블 클릭으로 붙이고자 하는 한지를 선택하면 처음 선택한 한지와 근접한 한지들을 선택할 수 있습니다. 붙일 한지를 모두 선택한 뒤에는 우 클릭의 콘텍스트 메뉴로 '붙이기'를 눌러 선택한 한지를 붙일 수 있습니다.`
        ];
        this.focusList = [];
        this.focusIdx = null;

        new IDB("seoul", ["inventory"], async db => {
            this.db = db;
            this.inventory = await this.getInventory();

            this.ws = new Workspace(this);

            let tags = (await fetch("/json/craftworks.json").then(res => res.json())).reduce((p, c) => [...p, ...c.hash_tags], []).map(tag => tag.substr(1));
            this.entryModule = new HashModule("#entry-tags", tags);

            this.setEvents();
        });
    }
    get focusItem(){
        return this.focusList[this.focusIdx];
    }

    makeContextMenu(x, y, menus){
        $(".context-menu").remove();
        let $menus = $(`<div class="context-menu" style="left: ${x}px; top: ${y}px;"></div>`);

        menus.forEach(({name, onclick}) => {
            let $menu = $(`<div class="context-menu__item">${name}</div>`)
            $menu.on("mousedown", onclick);
            $menus.append($menu);
        });

        $(document.body).append($menus);
    }

    getInventory(){
        return this.db.getAll("inventory");
    }

    setEvents(){
        $(window).on("mousedown", e => {
            $(".context-menu").remove();
        }); 


        $("[data-role].tool__item").on("click", e => {
            let role = e.currentTarget.dataset.role;
            $(".tool__item").removeClass("active");

            if(this.ws.tool){
                this.ws.tool.cancel && this.ws.tool.cancel();
                this.ws.tool.unselectAll();
            }
            
            if(this.ws.selected !== null && this.ws.selected == role){
                this.ws.selected = null;
            } else {
                this.ws.selected = role;
                e.currentTarget.classList.add("active");
            }
        });

        $("#btn-remove").on("mousedown", e => {
            if(this.ws.selected === "select" && this.ws.tool.selected !== null) {
                this.ws.parts = this.ws.parts.filter(part => part !== this.ws.tool.selected);
                this.ws.tool.unselectAll();
            } else {
                alert("한지를 선택해 주세요.");
            }
        });


        $("[data-target='#add-modal']").on("click", e => {
            $("#add-modal .row").html( this.inventory.map(item => `<div class="col-lg-3">
                                                                        <div class="item bg-white border" data-id="${item.id}">
                                                                            <img src="${item.image}" alt="이미지" class="fit-cover hx-200">
                                                                            <div class="p-3 border-top">
                                                                                <span class="fx-3">${item.paper_name}</span>
                                                                                <div class="mt-2">
                                                                                    <span class="fx-n2 text-muted">사이즈</span>
                                                                                    <span class="ml-2 fx-n1">${item.width_size}px × ${item.height_size}px</span>
                                                                                </div>
                                                                                <div class="mt-2">
                                                                                    <span class="fx-n2 text-muted">소지수량</span>
                                                                                    <span class="ml-2 fx-n1">${item.count}개</span>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </div>`).join("") );
        });
        $("#add-modal").on("click", ".item", async e => {
            let item = this.inventory.find(item => item.id == e.currentTarget.dataset.id);
            item.count--;
        
            if(item.count == 0){
                this.inventory = this.inventory.filter(im => im !== item);
                await this.db.delete("inventory", item.id);
            } else {
                this.db.put("inventory", item);
            }

            this.ws.addPart(item);
            $("#add-modal").modal("hide");
        });

        // 도움말 영역
        $("#btn-search").on("click", e => search(e));
        $(".helper-search > input").on("keydown", e => {
            if(e.keyCode === 13) search(e)
        });
        
        var search = e => {
            if(!$(".helper-search > input").val()) return;

            this.helpers.forEach((text, i) => {
                let regex = new RegExp( $(".helper-search > input").val().replace(/([.*?+^$\(\)\[\]\\\\\\//])/g, "\\$1"), "g" );
                $(".helper-body > .tab").eq(i).html( text.replace(regex, m1 => `<span>${m1}</span>`) );
            });

            this.focusList =  Array.from($(".helper-body span"));
            if(this.focusList.length > 0){
                this.focusIdx = 0;
                this.focusItem.classList.add("active");
    
                let target = this.focusItem.parentElement.dataset.target;
                $("input[name='tab']").removeAttr("checked");
                $(target).attr("checked", true);
    
                $(".helper-message").text(`${this.focusList.length}개 중 ${this.focusIdx + 1}번째`);
            } else {
                this.focusIdx = null;
                $(".helper-message").text(`일치하는 내용이 없습니다.`);
            }
        };

        $("#btn-prev").on("click", e => {
            if(this.focusIdx === null) return;
            this.focusItem.classList.remove("active");

            this.focusIdx = this.focusIdx - 1 < 0 ? this.focusList.length - 1 : this.focusIdx - 1;

            this.focusItem.classList.add("active");

            let target = this.focusItem.parentElement.dataset.target;
            $("input[name='tab']").removeAttr("checked");
            $(target).attr("checked", true);

            $(".helper-message").text(`${this.focusList.length}개 중 ${this.focusIdx + 1}번째`);
        });

        $("#btn-next").on("click", e => {
            if(this.focusIdx === null) return;
            this.focusItem.classList.remove("active");

            this.focusIdx = this.focusIdx + 1 >= this.focusList.length ? 0 : this.focusIdx + 1;

            this.focusItem.classList.add("active");

            let target = this.focusItem.parentElement.dataset.target;
            $("input[name='tab']").removeAttr("checked");
            $(target).attr("checked", true);

            $(".helper-message").text(`${this.focusList.length}개 중 ${this.focusIdx + 1}번째`);
        });
    }
}

$(function(){
    let app = new App();
});