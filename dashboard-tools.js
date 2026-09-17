<script>
const DB_TOOLS={
  'activity-logs':'.activity-logs-panel',
  'secondhand-tool':'.second-hand-panel',
  'product-info':'.product-tool-panel',
  'csv-config':'.csv-tool-panel',
  'mte-config':'.master-list-config'
};

const wrapper=document.querySelector('.db-tool-wrapper');

if(wrapper)wrapper.style.display='none';

Object.values(DB_TOOLS).forEach(selector=>{
  const panel=document.querySelector(selector);
  if(panel)panel.style.display='none';
});

function openDBTool(id){
  const selector=DB_TOOLS[id];
  if(!selector)return;

  if(wrapper)wrapper.style.display='block';

  Object.values(DB_TOOLS).forEach(selector=>{
    const panel=document.querySelector(selector);
    if(panel)panel.style.display='none';
  });

  const panel=document.querySelector(selector);
  if(panel)panel.style.display='block';

  document.dispatchEvent(new CustomEvent('db-tool-open',{detail:{id}}));
}

function closeDBTool(){
  if(wrapper)wrapper.style.display='none';

  Object.values(DB_TOOLS).forEach(selector=>{
    const panel=document.querySelector(selector);
    if(panel)panel.style.display='none';
  });

  document.dispatchEvent(new CustomEvent('db-tool-close'));
}

document.querySelectorAll('.db-list-toolcard').forEach(card=>{
  const id=card.dataset.select;
  if(id&&DB_TOOLS[id]){
    card.style.cursor='pointer';
    card.addEventListener('click',()=>openDBTool(id));
  }
});

document.querySelectorAll('#exit-btn').forEach(button=>{
  button.addEventListener('click',closeDBTool);
});
</script>

<script>
const DB_HEADINGS={
  'activity-logs':'Activity Logs',
  'secondhand-tool':'Secondhand Stock',
  'product-info':'Product Information',
  'csv-config':'CSV Config',
  'mte-config':'MTE Config'
};

const toolHeading=document.querySelector('.tool-wrapper-h2');
const headingList=document.querySelector('.db-heading-list[data-type="breadcrumb"]');

document.addEventListener('db-tool-open',e=>{
  const name=DB_HEADINGS[e.detail.id];
  if(!name)return;

  if(toolHeading)toolHeading.textContent=name;
  if(headingList)headingList.textContent=name;
});
</script>

<!-- activity logs -->

<script type="module">
import{collection,getDocs}from'https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js';
const db=window.db;

const tableBody=document.querySelector('.activity-table-body');
const logsText=document.querySelector('.logs-text');
const refreshButton=document.querySelector('.activity-refresh-button');
const refreshIcon=document.querySelector('.refresh-icon');
const toolFilter=document.querySelector('.activity-filter-tool');
const userFilter=document.querySelector('.activity-filter-user');
const actionFilter=document.querySelector('.activity-filter-action');

let allLogs=[],filteredLogs=[],selectedTool='all',selectedUser='',selectedAction='all';
const LOGS_PER_PAGE=100;
let currentPage=1,totalPages=1;

const pagination=document.createElement('div');
pagination.className='activity-pagination';
pagination.innerHTML=`<div class="activity-page-button activity-prev-button">Previous</div><div class="activity-page-text">Page 1 / 1</div><div class="activity-page-button activity-next-button">Next</div>`;
if(tableBody&&tableBody.parentElement)tableBody.parentElement.appendChild(pagination);
const prevButton=pagination.querySelector('.activity-prev-button');
const nextButton=pagination.querySelector('.activity-next-button');
const pageText=pagination.querySelector('.activity-page-text');

document.addEventListener('db-tool-open',async(e)=>{
  if(e.detail.id!=='activity-logs')return;

  await new Promise(resolve=>setTimeout(resolve,2000));
  await loadActivityLogs();
});

if(refreshButton){
  refreshButton.style.cursor='pointer';
  refreshButton.addEventListener('click',async()=>{
    try{refreshIcon?.classList.add('spinning');await loadActivityLogs();}
    finally{refreshIcon?.classList.remove('spinning');}
  });
}

async function loadActivityLogs(){
  if(!db||!tableBody)return;
  tableBody.innerHTML='';
  const snapshot=await getDocs(collection(db,'search-logs'));
  allLogs=snapshot.docs.map((doc)=>{
    const d=doc.data();
    return{action:d.action||'-',email:d.email||'-',name:d.name||'-',query:d.query||'-',results:d.results||'-',tool:d.tool||d.tools||'-',time:d.time||null};
  });
  allLogs.sort((a,b)=>b.time-a.time);
  filteredLogs=[...allLogs];
  currentPage=1;
  renderLogs();
}

function applyFilters(){
  filteredLogs=[...allLogs];
  if(selectedTool!=='all')filteredLogs=filteredLogs.filter((l)=>String(l.tool).toLowerCase().includes(selectedTool.toLowerCase()));
  if(selectedUser.trim()!=='')filteredLogs=filteredLogs.filter((l)=>String(l.name).toLowerCase().includes(selectedUser.toLowerCase()));
  if(selectedAction!=='all')filteredLogs=filteredLogs.filter((l)=>String(l.action).toLowerCase().includes(selectedAction.toLowerCase()));
  totalPages=Math.max(1,Math.ceil(filteredLogs.length/LOGS_PER_PAGE));
  renderLogs();
}

function renderLogs(){
  tableBody.innerHTML='';
  const start=(currentPage-1)*LOGS_PER_PAGE;
  const page=filteredLogs.slice(start,start+LOGS_PER_PAGE);
  logsText.textContent=`Showing ${page.length} of ${filteredLogs.length}`;
  page.forEach((log)=>{
    const formattedTime=log.time?new Date(log.time).toLocaleString():"-";
    const row=document.createElement('div');
    row.className='activity-row';
    row.innerHTML=`<div class="row-text">${formattedTime}</div><div class="row-text">${log.name}</div><div class="row-text">${log.email}</div><div class="row-text">${log.tool}</div><div class="row-text">${log.query}</div><div class="row-text">${log.results}</div><div class="activity-action-box">${log.action}</div>`;
    tableBody.appendChild(row);
  });
  pageText.textContent=`Page ${currentPage} / ${totalPages}`;
}

prevButton?.addEventListener('click',()=>{if(currentPage>1){currentPage--;renderLogs();}});
nextButton?.addEventListener('click',()=>{if(currentPage<totalPages){currentPage++;renderLogs();}});
toolFilter?.addEventListener('change',(e)=>{selectedTool=e.target.value||'all';currentPage=1;applyFilters();});
userFilter?.addEventListener('input',(e)=>{selectedUser=e.target.value;currentPage=1;applyFilters();});
actionFilter?.addEventListener('change',(e)=>{selectedAction=e.target.value||'all';currentPage=1;applyFilters();});
</script>

<script type="module">
import{collection,getDocs,doc,addDoc,updateDoc,deleteDoc}from"https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js";
const db=window.db;

const panel=document.querySelector(".second-hand-panel");
const tableBody=document.querySelector(".second-hand-table-body");
const searchInput=document.querySelector(".second-hand-search-filter");
const locationSelect=document.querySelector(".second-hand-location-filter select");
const addBtn=document.querySelector(".second-hand-add-button");
const refreshBtn=document.querySelector(".second-hand-refresh-button");
const refreshIconSh=document.querySelector('.refresh-icon-sh');
const importBtn=document.querySelector(".second-hand-import-button");
const itemsText=document.querySelector(".items-text");

const csvInput=document.createElement("input");
csvInput.type="file";csvInput.accept=".csv";csvInput.style.display="none";
document.body.appendChild(csvInput);

const editModal=document.querySelector(".second-hand-overlay");
const editForm=document.querySelector(".second-hand-edit-form");
const saveBtn=document.querySelector(".second-hand-save-button");
const closeBtn=document.querySelector(".second-hand-close-button");
const closeIcon=document.querySelector(".close-icon");

function normalize(str){return String(str||"").replace(/\s+/g," ").trim();}

let allItems=[],filtered=[],search="",locationFilter="all",editingId=null;

document.addEventListener("db-tool-open",async(e)=>{
  if(e.detail.id!=="secondhand-stock")return;
  await loadItems();
});

async function loadItems(){
  if(!db||!tableBody)return;
  tableBody.innerHTML="";
  try{
    const snapshot=await getDocs(collection(db,"secondhand-stock"));
    allItems=snapshot.docs.map(d=>{
      const data=d.data();
      return{id:d.id,code:normalize(data.CODE),description:normalize(data.DESCRIPTION),qty:normalize(data.QTY),condition:normalize(data.CONDITION_REASON_FOR_SALE),location:normalize(data.LOCATION),price:`$${Math.round(Number(data.PRICE_EACH||0))}`};
    });
    populateLocations();
    applyFilters();
  }catch(error){console.error(error);}
}

async function createItem(data){
  await addDoc(collection(db,"secondhand-stock"),{CODE:normalize(data.code),DESCRIPTION:normalize(data.description),QTY:data.qty||0,CONDITION_REASON_FOR_SALE:normalize(data.condition),LOCATION:normalize(data.location),PRICE_EACH:data.price||0});
  await loadItems();
}

async function updateItem(id,data){
  await updateDoc(doc(db,"secondhand-stock",id),{CODE:normalize(data.code),DESCRIPTION:normalize(data.description),QTY:data.qty||0,CONDITION_REASON_FOR_SALE:normalize(data.condition),LOCATION:normalize(data.location),PRICE_EACH:data.price||0});
  await loadItems();
}

async function deleteItem(id){await deleteDoc(doc(db,"secondhand-stock",id));await loadItems();}

async function importCSV(file){
  const text=await file.text();
  const rows=text.split("\n").map(r=>r.trim()).filter(Boolean);
  if(rows.length<=1){alert("CSV is empty.");return;}
  const headers=rows[0].split(",").map(h=>normalize(h).toUpperCase());
  const existingCodes=new Set(allItems.map(item=>normalize(item.code).toUpperCase()));
  let importedCount=0;
  for(let i=1;i<rows.length;i++){
    const cols=rows[i].split(",").map(c=>c.replace(/^"|"$/g,"").trim());
    const row={};
    headers.forEach((header,index)=>{row[header]=cols[index]||"";});
    const code=normalize(row.CODE);
    if(!code)continue;
    if(existingCodes.has(code.toUpperCase()))continue;
    await addDoc(collection(db,"secondhand-stock"),{CODE:code,DESCRIPTION:normalize(row.DESCRIPTION),QTY:normalize(row.QTY),CONDITION_REASON_FOR_SALE:normalize(row.CONDITION_REASON_FOR_SALE),LOCATION:normalize(row.LOCATION),PRICE_EACH:normalize(row.PRICE_EACH)});
    importedCount++;
  }
  alert(`${importedCount} new items imported successfully.`);
  await loadItems();
}

function openModal(){if(editModal)editModal.style.display="flex";document.body.style.overflow="hidden";}
function closeModal(){if(editModal)editModal.style.display="none";document.body.style.overflow="";editingId=null;}

function render(){
  if(!tableBody)return;
  tableBody.innerHTML="";
  filtered.forEach(item=>{
    const row=document.createElement("div");
    row.className="second-hand-row";
    row.innerHTML=`<div class="row-text">${item.code}</div><div class="row-text">${item.description}</div><div class="row-text">${item.qty}</div><div class="row-text">${item.condition}</div><div class="row-text">${item.location}</div><div class="row-text">${item.price}</div><div style="display:flex; gap:8px;"><div class="activity-action-box edit-btn" data-id="${item.id}" style="cursor:pointer;">Edit</div><div class="activity-action-box delete-btn" data-id="${item.id}" style="cursor:pointer;background:rgba(255,0,0,0.12);">Delete</div></div>`;
    tableBody.appendChild(row);
  });
  bindActions();
  if(itemsText)itemsText.textContent=`${filtered.length} items`;
}

function applyFilters(){
  filtered=[...allItems];
  if(search.trim()){
    const s=search.toLowerCase();
    filtered=filtered.filter(item=>item.code.toLowerCase().includes(s)||item.description.toLowerCase().includes(s)||item.location.toLowerCase().includes(s));
  }
  if(locationFilter!=="all")filtered=filtered.filter(item=>item.location===locationFilter);
  render();
}

function populateLocations(){
  if(!locationSelect)return;
  const uniqueLocations=[...new Set(allItems.map(item=>item.location).filter(Boolean))].sort();
  locationSelect.innerHTML=`<option value="all">All Locations</option>`;
  uniqueLocations.forEach(location=>{
    const option=document.createElement("option");
    option.value=location;option.textContent=location;
    locationSelect.appendChild(option);
  });
}

function bindActions(){
  document.querySelectorAll(".delete-btn").forEach(button=>{
    button.onclick=async()=>{
      const id=button.dataset.id;
      if(!confirm("Delete this item?"))return;
      await deleteItem(id);
    };
  });
  document.querySelectorAll(".edit-btn").forEach(button=>{
    button.onclick=()=>{
      const id=button.dataset.id;
      const item=allItems.find(item=>item.id===id);
      if(!item)return;
      editingId=id;
      document.querySelector('[name="code"]').value=item.code||"";
      document.querySelector('[name="description"]').value=item.description||"";
      document.querySelector('[name="qty"]').value=item.qty||"";
      document.querySelector('[name="condition"]').value=item.condition||"";
      document.querySelector('[name="location"]').value=item.location||"";
      document.querySelector('[name="price"]').value=item.price||"";
      openModal();
    };
  });
}

saveBtn?.addEventListener("click",async(e)=>{
  e.preventDefault();
  const data={
    code:document.querySelector('[name="code"]').value,
    description:document.querySelector('[name="description"]').value,
    qty:document.querySelector('[name="qty"]').value,
    condition:document.querySelector('[name="condition"]').value,
    location:document.querySelector('[name="location"]').value,
    price:document.querySelector('[name="price"]').value
  };
  try{
    if(editingId)await updateItem(editingId,data);else await createItem(data);
    closeModal();
  }catch(error){console.error(error);}
});

closeBtn?.addEventListener("click",closeModal);
closeIcon?.addEventListener("click",closeModal);
searchInput?.addEventListener("input",e=>{search=e.target.value;applyFilters();});
locationSelect?.addEventListener("change",e=>{locationFilter=e.target.value;applyFilters();});

refreshBtn.addEventListener('click',async()=>{
  try{refreshIconSh?.classList.add('spinning');await loadItems();}
  finally{refreshIconSh?.classList.remove('spinning');}
});

addBtn?.addEventListener("click",()=>{editingId=null;editForm?.reset();openModal();});

importBtn?.addEventListener("click",()=>{
  if(!confirm("This will import new items from the CSV file and merge them with your existing data. Your current edits will be preserved. Continue?"))return;
  csvInput.value="";
  csvInput.click();
});

csvInput.addEventListener("change",async(e)=>{
  const file=e.target.files?.[0];
  if(!file)return;
  try{await importCSV(file);}
  catch(error){console.error(error);alert("Failed to import CSV.");}
});
</script>

<script type="module">
import{collection,getDocs,doc,setDoc}from"https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js";
const db=window.db;

const saveBtn=document.querySelector(".csv-tool-save-button");
const alloyInput=document.querySelector('[name="wheelsheetalloyData"]');
const steelInput=document.querySelector('[name="wheelsheetsteelData"]');
const roadmasterInput=document.querySelector('[name="roadmaster_data"]');
const chassisInput=document.querySelector('[name="chassis_master_mte_export"]');

let existingLinks={};

document.addEventListener("db-tool-open",async(e)=>{
  if(e.detail.id!=="tool-csv")return;
  await loadCsvLinks();
});

async function loadCsvLinks(){
  try{
    const snapshot=await getDocs(collection(db,"csv-data"));
    const dataMap={};

    snapshot.forEach(docSnap=>{
      const data=docSnap.data();
      if(data.name&&data.link)dataMap[data.name]=data.link;
    });

    existingLinks={...dataMap};

    if(alloyInput)alloyInput.value=dataMap.wheelsheetalloyData||"";
    if(steelInput)steelInput.value=dataMap.wheelsheetsteelData||"";
    if(roadmasterInput)roadmasterInput.value=dataMap.roadmaster_data||"";
    if(chassisInput)chassisInput.value=dataMap.chassis_master_mte_export||"";

  }catch(error){
    console.error("Failed to load CSV links:",error);
    alert("Failed to load existing CSV links");
  }
}

saveBtn?.addEventListener("click",async e=>{
  e.preventDefault();

  const links=[
    ["wheelsheetalloyData",alloyInput],
    ["wheelsheetsteelData",steelInput],
    ["roadmaster_data",roadmasterInput],
    ["chassis_master_mte_export",chassisInput]
  ];

  try{
    saveBtn.disabled=true;
    saveBtn.textContent="Saving...";

    await Promise.all(
      links.map(([name,input])=>{
        const value=input?.value?.trim();

        // Keep the existing database URL if the field is empty
        const link=value||existingLinks[name];

        // Never write null/empty data
        if(!link)return Promise.resolve();

        return setDoc(
          doc(db,"csv-data",name),
          {name,link},
          {merge:true}
        );
      })
    );

    // Update our local copy after successful save
    links.forEach(([name,input])=>{
      const value=input?.value?.trim();
      if(value)existingLinks[name]=value;
    });

    saveBtn.textContent="Saved!";

    setTimeout(()=>{
      saveBtn.textContent="Save";
      saveBtn.disabled=false;
    },2000);

  }catch(error){
    console.error("Failed to update CSV links:",error);
    saveBtn.textContent="Save";
    saveBtn.disabled=false;
    alert("Failed to update CSV links");
  }
});
</script>

<script type="module">
import{collection,getDocs,doc,addDoc,updateDoc,deleteDoc}from"https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js";
const db=window.db;

const resultsGrid=document.querySelector(".product-results-grid");
const addBtn=document.querySelector(".product-add-button");
const searchInput=document.querySelector(".product-search-input");
const overlay=document.querySelector(".product-add-product-panel");
const exitIcon=document.querySelector(".exit-icon");
const form=document.querySelector(".add-product-form");

let allItems=[],filtered=[],editingId=null,searchTerm="";

async function loadItems(){
  if(!db||!resultsGrid)return;
  resultsGrid.innerHTML="";
  try{
    const snapshot=await getDocs(collection(db,"product-information"));
    allItems=snapshot.docs.map(d=>({id:d.id,...d.data()}));
    applyFilters();
  }catch(err){console.error("Failed to load products:",err);}
}
window.loadProductItems=loadItems;

document.addEventListener("db-tool-open",async(e)=>{
  if(e.detail.id!=="products")return;
  await loadItems();
});

function applyFilters(){
  filtered=[...allItems];
  if(searchTerm.trim()){
    const s=searchTerm.toLowerCase();
    filtered=filtered.filter(item=>String(item.title||"").toLowerCase().includes(s)||String(item.description||"").toLowerCase().includes(s));
  }
  render();
}

function render(){
  if(!resultsGrid)return;
  resultsGrid.innerHTML="";
  filtered.forEach(item=>{
    const card=document.createElement("div");
    card.className="product-result-card";
    card.innerHTML=`<img src="${item.image||"https://cdn.prod.website-files.com/plugins/Basic/assets/placeholder.60f9b1840c.svg"}" loading="lazy" alt="" class="product-image"><div class="product-card-text">${item.title||"Unnamed Product"}</div><div class="product-card-button-wrapper"><div class="w-layout-grid product-card-button-grid"><div class="product-card-edit" data-id="${item.id}"><div class="edit-icon w-embed"><svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M21.121 2.707a2 2 0 0 0-2.828 0L7 14v4h4L21.121 5.535a2 2 0 0 0 0-2.828z" fill="currentColor"/></svg></div><div class="product-text">Edit</div></div><div class="product-card-copy" data-id="${item.id}"><div class="copy-icon w-embed"><svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M16 1H4a2 2 0 0 0-2 2v12h2V3h12V1zM20 5H8a2 2 0 0 0-2 2v14a2 2 0 0 0 2-2V7h12v14H8V7h12z" fill="currentColor"/></svg></div><div class="product-text">Copy</div></div></div></div><div class="product-card-delete-wrapper"><div class="product-card-delete" data-id="${item.id}"><div class="delete-icon w-embed"><svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6 7h12l-1 14H7L6 7zm3-3h6l1 2H8l1-2z" fill="currentColor"/></svg></div><div class="product-text-delete">Delete</div></div></div>`;
    resultsGrid.appendChild(card);
  });
  bindActions();
}

function bindActions(){
  document.querySelectorAll(".product-card-delete").forEach(btn=>{
    btn.onclick=async()=>{
      if(!confirm("Delete this product?"))return;
      try{await deleteDoc(doc(db,"product-information",btn.dataset.id));await loadItems();}
      catch(err){console.error("Delete failed:",err);}
    };
  });
  document.querySelectorAll(".product-card-edit").forEach(btn=>{
    btn.onclick=()=>{
      const item=allItems.find(i=>i.id===btn.dataset.id);
      if(!item)return;
      editingId=btn.dataset.id;
      openModal();
      populateForm(item);
    };
  });
  document.querySelectorAll(".product-card-copy").forEach(btn=>{
    btn.onclick=()=>{
      const item=allItems.find(i=>i.id===btn.dataset.id);
      if(!item)return;
      editingId=null;
      openModal();
      populateForm(item);
    };
  });
}

function createSpecRow(value=""){
  const wrapper=document.createElement("div");
  wrapper.innerHTML=`<div class="specifications-flex"><input class="specifications-input w-input" maxlength="256" name="specifications" placeholder="e.g. Weight: 250lbs" type="text" value="${String(value).replace(/"/g,"&quot;")}"><div class="remove-icon w-embed" style="cursor:pointer;"><svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M7 17L16.8995 7.10051" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"></path><path d="M7 7.00001L16.8995 16.8995" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"></path></svg></div></div>`;
  const row=wrapper.firstElementChild;
  row.querySelector(".remove-icon").addEventListener("click",()=>{row.remove();});
  return row;
}

function createPartRow(label="",value="",url=""){
  const hasUrl=!!url;
  const wrapper=document.createElement("div");
  wrapper.innerHTML=`<div class="add-product-label-wrapper"><div class="w-layout-grid add-product-label-grid"><div class="add-product-label-card"><div class="small-text">Label (Field 1)</div><input class="product-form-label-field w-input" maxlength="256" name="label" placeholder="e.g. Part Name" type="text" value="${String(label).replace(/"/g,"&quot;")}"></div><div class="add-product-label-card"><div class="small-text">Value (Field 2)</div><input class="product-form-label-field w-input" maxlength="256" name="value" placeholder="e.g. 550045" type="text" value="${String(value).replace(/"/g,"&quot;")}"></div></div><div class="add-product-label-link-wrapper"><label class="w-checkbox"><input type="checkbox" class="w-checkbox-input label-link-checkbox" ${hasUrl?"checked":""}><span class="small-text w-form-label">Add link to value (optional)</span></label><div class="remove-icon-part w-embed" style="cursor:pointer;"><svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M7 17L16.8995 7.10051" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"></path><path d="M7 7.00001L16.8995 16.8995" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"></path></svg></div></div><input class="add-url-input w-input" maxlength="256" name="url" placeholder="https://..." type="text" value="${String(url).replace(/"/g,"&quot;")}" style="display:${hasUrl?"block":"none"};"></div>`;
  const row=wrapper.firstElementChild;
  const checkbox=row.querySelector(".label-link-checkbox");
  const urlInput=row.querySelector('[name="url"]');
  checkbox.addEventListener("change",()=>{urlInput.style.display=checkbox.checked?"block":"none";});
  row.querySelector(".remove-icon-part").addEventListener("click",()=>{row.remove();});
  return row;
}

document.querySelector(".add-product-new-specifications")?.addEventListener("click",()=>{
  const addSpecBtn=document.querySelector(".add-product-new-specifications");
  addSpecBtn.parentElement.insertBefore(createSpecRow(),addSpecBtn);
});

document.querySelector(".add-product-new-part")?.addEventListener("click",()=>{
  const addPartBtn=document.querySelector(".add-product-new-part");
  addPartBtn.parentElement.insertBefore(createPartRow(),addPartBtn);
});

function collectFormData(){
  const specifications=[];
  form?.querySelectorAll('[name="specifications"]').forEach(input=>{const v=input.value.trim();if(v)specifications.push(v);});
  const parts=[];
  form?.querySelectorAll(".add-product-label-wrapper").forEach(row=>{
    const label=row.querySelector('[name="label"]')?.value.trim();
    const value=row.querySelector('[name="value"]')?.value.trim();
    const hasLink=row.querySelector(".label-link-checkbox")?.checked;
    const url=hasLink?row.querySelector('[name="url"]')?.value.trim():"";
    if(label||value)parts.push({label:label||"",value:value||"",url:url||""});
  });
  return{
    title:form?.querySelector('[name="title"]')?.value.trim()||"",
    category:form?.querySelector('[name="category"]')?.value.trim()||"",
    image:form?.querySelector('[name="imageurl"]')?.value.trim()||"",
    description:form?.querySelector('[name="description"]')?.value.trim()||"",
    specifications,parts
  };
}

document.querySelector(".add-product-form-save-btn")?.addEventListener("click",async()=>{
  const data=collectFormData();
  if(!data.title){alert("Product name is required.");return;}
  try{
    if(editingId)await updateDoc(doc(db,"product-information",editingId),data);
    else await addDoc(collection(db,"product-information"),data);
    closeModal();
    await loadItems();
  }catch(err){console.error("Save failed:",err);alert("Failed to save product.");}
});

function populateForm(item){
  if(!form)return;
  form.querySelector('[name="title"]').value=item.title||"";
  form.querySelector('[name="category"]').value=item.category||"";
  form.querySelector('[name="imageurl"]').value=item.image||"";
  form.querySelector('[name="description"]').value=item.description||"";
  const addSpecBtn=form.querySelector(".add-product-new-specifications");
  form.querySelectorAll(".specifications-flex").forEach(row=>row.remove());
  if(item.specifications?.length)item.specifications.forEach(spec=>addSpecBtn.parentElement.insertBefore(createSpecRow(spec),addSpecBtn));
  else addSpecBtn.parentElement.insertBefore(createSpecRow(),addSpecBtn);
  const addPartBtn=form.querySelector(".add-product-new-part");
  form.querySelectorAll(".add-product-label-wrapper").forEach(row=>row.remove());
  if(item.parts?.length)item.parts.forEach(part=>addPartBtn.parentElement.insertBefore(createPartRow(part.label||"",part.value||"",part.url||""),addPartBtn));
  else addPartBtn.parentElement.insertBefore(createPartRow(),addPartBtn);
}

function resetForm(){
  if(!form)return;
  form.querySelector('[name="title"]').value="";
  form.querySelector('[name="category"]').value="";
  form.querySelector('[name="imageurl"]').value="";
  form.querySelector('[name="description"]').value="";
  form.querySelectorAll(".specifications-flex").forEach(row=>row.remove());
  form.querySelectorAll(".add-product-label-wrapper").forEach(row=>row.remove());
  const addSpecBtn=form.querySelector(".add-product-new-specifications");
  const addPartBtn=form.querySelector(".add-product-new-part");
  addSpecBtn.parentElement.insertBefore(createSpecRow(),addSpecBtn);
  addPartBtn.parentElement.insertBefore(createPartRow(),addPartBtn);
}

function openModal(){if(overlay)overlay.style.display="flex";}
function closeModal(){if(overlay)overlay.style.display="none";editingId=null;resetForm();}

addBtn?.addEventListener("click",()=>{editingId=null;resetForm();openModal();});
exitIcon?.addEventListener("click",closeModal);
searchInput?.addEventListener("input",e=>{searchTerm=e.target.value;applyFilters();});
</script>

<script type="module">
import{doc,getDoc,setDoc}from"https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js";

const db=window.db;

const CONFIG_REF=doc(db,"mte-config","chassis-fields");
const CSV_LINK_REF=doc(db,"csv-data","chassis_master_mte_export");

const wrapper=document.querySelector(".master-list-config-wrapper-select");

let allHeaders=[];
let currentEnabled=new Set();

/* GET CSV URL */
async function getCsvUrl(){
  try{
    const snap=await getDoc(CSV_LINK_REF);
    if(!snap.exists()){
      console.error("chassis_master_mte_export doc not found in csv-data");
      return"";
    }
    return snap.data().link||"";
  }catch(err){
    console.error("Failed to fetch CSV URL:",err);
    return"";
  }
}

/* LOAD CSV HEADERS */
async function loadHeaders(){
  const url=await getCsvUrl();

  if(!url){
    if(wrapper){
      wrapper.innerHTML=`
        <div style="color:#ff8080;font-size:13px;">
          No CSV link found for chassis_master_mte_export.
        </div>
      `;
    }
    return[];
  }

  try{
    const res=await fetch(url);

    if(!res.ok){
      throw new Error(
        `CSV request failed: ${res.status} ${res.statusText}`
      );
    }

    const text=await res.text();
    const headerLine=text.split(/\r?\n/)[0];

    const headers=[];
    let current="";
    let inQuotes=false;

    for(let i=0;i<headerLine.length;i++){
      const char=headerLine[i];

      if(char==='"'){
        if(inQuotes&&headerLine[i+1]==='"'){
          current+='"';
          i++;
        }else{
          inQuotes=!inQuotes;
        }
      }else if(char===','&&!inQuotes){
        headers.push(current.trim());
        current="";
      }else{
        current+=char;
      }
    }

    headers.push(current.trim());

    return headers.filter(Boolean);

  }catch(err){
    console.error("Failed to fetch/parse CSV:",err);

    if(wrapper){
      wrapper.innerHTML=`
        <div style="color:#ff8080;font-size:13px;">
          Failed to load CSV columns.
        </div>
      `;
    }

    return[];
  }
}

/* LOAD MTE CONFIG */
async function loadMteConfig(){

  allHeaders=await loadHeaders();

  if(!allHeaders.length)return;

  try{
    const snap=await getDoc(CONFIG_REF);

    if(
      snap.exists() &&
      Array.isArray(snap.data().enabledFields)
    ){
      currentEnabled=new Set(
        snap.data().enabledFields
      );
    }else{
      currentEnabled=new Set(allHeaders);
    }

  }catch(err){

    console.error(
      "Failed to load MTE field config:",
      err
    );

    currentEnabled=new Set(allHeaders);
  }

  renderCheckboxes();
}

/* RENDER CHECKBOXES */
function renderCheckboxes(){

  if(!wrapper)return;

  wrapper.innerHTML="";

  allHeaders.forEach(header=>{

    const row=document.createElement("label");

    row.className="mte-config-checkbox-row";

    row.innerHTML=`
      <input
        type="checkbox"
        class="mte-config-checkbox"
        data-key="${header}"
        ${currentEnabled.has(header)?"checked":""}
      >
      <span>${header}</span>
    `;

    wrapper.appendChild(row);
  });

  const saveArea=document.createElement("div");

  saveArea.className="mte-config-save-area";
  saveArea.style.marginTop="20px";

  saveArea.innerHTML=`
    <button
      type="button"
      class="mte-config-save-button"
      style="
        padding:10px 20px;
        border:0;
        border-radius:6px;
        cursor:pointer;
        font-weight:600;
      "
    >
      Save Configuration
    </button>

    <span
      class="mte-config-status-text"
      style="
        margin-left:12px;
        font-size:13px;
      "
    ></span>
  `;

  wrapper.appendChild(saveArea);

  const saveBtn=
    saveArea.querySelector(
      ".mte-config-save-button"
    );

  saveBtn.addEventListener(
    "click",
    saveMteConfig
  );
}

/* SAVE MTE CONFIGURATION */
async function saveMteConfig(e){

  e.preventDefault();

  const saveBtn=e.currentTarget;

  const statusText=
    saveBtn.parentElement.querySelector(
      ".mte-config-status-text"
    );

  if(saveBtn.disabled)return;

  const checked=Array.from(
    wrapper.querySelectorAll(
      ".mte-config-checkbox:checked"
    )
  )
  .map(el=>el.dataset.key)
  .filter(Boolean);

  if(!checked.length){

    statusText.textContent=
      "Select at least one field.";

    statusText.style.color="#535863";

    return;
  }

  try{

    saveBtn.disabled=true;
    saveBtn.textContent="Saving...";
    statusText.textContent="";

    await setDoc(
      CONFIG_REF,
      {
        enabledFields:checked,
        updatedAt:new Date().toISOString()
      },
      {
        merge:true
      }
    );

    currentEnabled=new Set(checked);

    saveBtn.textContent="Saved!";

    statusText.textContent=
      `Saved ${checked.length} field${checked.length===1?"":"s"}.`;

    statusText.style.color="";

    setTimeout(()=>{

      saveBtn.textContent=
        "Save Configuration";

      statusText.textContent="";

      saveBtn.disabled=false;

    },2000);

  }catch(err){

    console.error(
      "Failed to save MTE field config:",
      err
    );

    saveBtn.disabled=false;

    saveBtn.textContent=
      "Save Configuration";

    statusText.textContent=
      "Failed to save configuration.";

    statusText.style.color="#ff8080";
  }
}

/* LOAD WHEN MTE TOOL OPENS */
document.addEventListener("db-tool-open",e=>{
  if(e.detail.id!=="mte-config")return;
  loadMteConfig();
});

</script>

<script>
(function(){
'use strict';

const T={
 ep:{card:'et-everyday-card',cut:'everyday-card-cut',inner:'everyday-card',title:'everyday-card-title-wrapper',h2:'H2-text-card-white',bodyWrap:'everyday-card-body-wrapper',body:'everyday-card-body'},
 cp:{card:'et-clearance-card',cut:'clearance-card-cut',inner:'clearance-card',title:'clearance-card-title-wrapper',h2:'H2-text-card-black',price:'black',bodyWrap:'clearance-card-body-wrapper',body:'clearance-card-body'},
 pp:{card:'et-promo-card',cut:'promo-card-cut',inner:'promo-card',title:'promo-card-title-wrapper',h2:'H2-text-card-white',price:'red',bodyWrap:'promo-card-body-wrapper',body:'promo-card-body'}
};

const HEAD={ep:'EVERYDAY LOW PRICES!',cp:'MASSIVE CLEARANCE!',pp:'HOT PROMO PRICES!'};

const CAPS={nineup:9,sixup:6,fourup:4,twoup:2,oneup:1};
const GRID={
 nineup:[3,3],sixup:[3,2],fourup:[2,2],twoup:[1,2],oneup:[1,1]
};

const FIELDS={
 title:'Product Title',
 description:'Description',
 price:'Price',
 oldPrice:'Old Price',
 partNumber:'Part Number',
 extraNote:'Extra Note'
};

const DEFAULT_FIELDS={
 title:{v:1,a:'left',fit:1},
 description:{v:1,a:'left',fit:1},
 price:{v:1,a:'left',fit:1},
 oldPrice:{v:1,a:'right',fit:1},
 partNumber:{v:1,a:'left',fit:1},
 extraNote:{v:1,a:'left',fit:1}
};

const state={type:'ep',layout:'nineup',cards:[]};
const els={};
let id=0,editing=null;

function defStyle(){
 return {
  body:{d:'flex',dir:'column',j:'start',a:'stretch',gap:2},
  fields:JSON.parse(JSON.stringify(DEFAULT_FIELDS))
 };
}

function cardData(x){
 return Object.assign({
  id:'card-'+(++id),
  title:'PRODUCT TITLE',
  description:'Product description goes here. Maximum of 2 lines.',
  price:'999.99',
  oldPrice:'999.99',
  partNumber:'#00000',
  extraNote:'EXCLUSIVE OF GST',
  style:defStyle()
 },x||{});
}

function get(id){return state.cards.find(x=>x.id===id)}

function add(x){
 const c=cardData(x);
 state.cards.push(c);
 render();
 return c;
}

function del(id){
 state.cards=state.cards.filter(x=>x.id!==id);
 if(editing===id) hideEdit();
 render();
}

function cache(){
 els.header=document.querySelector('.et-header-wrapper');
 els.type=document.querySelector('.et-tool-type-selector');
 els.layout=document.querySelector('.et-card-type-selector');
 els.list=document.querySelector('.et-current-card-wrapper');
 els.add=document.querySelector('.et-add-card-wrapper [btn="add"]');
 els.print=document.querySelector('.et-print-card-wrapper [btn="print"]');
 els.pages=document.querySelector('.et-card-body-wrapper');
}

function flexJ(x){
 return {
  start:'flex-start',
  center:'center',
  end:'flex-end',
  between:'space-between',
  around:'space-around',
  evenly:'space-evenly'
 }[x]||'flex-start';
}

function flexA(x){
 return {
  start:'flex-start',
  center:'center',
  end:'flex-end',
  stretch:'stretch'
 }[x]||'stretch';
}

function container(el,s){
 if(!el||!s)return;
 el.style.display=s.d==='grid'?'grid':'flex';
 if(s.d==='grid'){
  el.style.gridTemplateColumns='repeat('+Math.max(1,s.cols||2)+',minmax(0,1fr))';
  el.style.gap=(s.gap||0)+'px';
 }else{
  el.style.flexDirection=s.dir||'column';
  el.style.justifyContent=flexJ(s.j);
  el.style.alignItems=flexA(s.a);
  el.style.gap=(s.gap||0)+'px';
 }
}

function fieldStyle(el,s){
 if(!el||!s)return;
 el.style.display=s.v===0?'none':'';
 if(s.size)el.style.fontSize=s.size+'px';
 if(s.line)el.style.lineHeight=s.line;
 if(s.a)el.style.textAlign=s.a;
 if(s.w)el.style.width=s.w;
 if(s.mt!=null)el.style.marginTop=s.mt+'px';
 if(s.mr!=null)el.style.marginRight=s.mr+'px';
 if(s.mb!=null)el.style.marginBottom=s.mb+'px';
 if(s.ml!=null)el.style.marginLeft=s.ml+'px';
}

function text(cls,field,value,sizeClass){
 const e=document.createElement('div');
 e.className=cls;
 e.dataset.field=field;
 if(sizeClass)e.classList.add(sizeClass);
 e.textContent=value||'';
 return e;
}

function build(card){
 const t=T[state.type],sz={one:'one',two:'two',four:'four',six:'six'}[state.layout];
 const s=card.style||defStyle();

 const wrap=document.createElement('div');
 wrap.className=t.card;
 wrap.dataset.cardId=card.id;
 wrap.style.position='relative';

 const cut=document.createElement('div');
 cut.className=t.cut;
 wrap.appendChild(cut);

 const inner=document.createElement('div');
 inner.className=t.inner;

 const tw=document.createElement('div');
 tw.className=t.title;

 const h=document.createElement('h2');
 h.className=t.h2;
 h.textContent=HEAD[state.type];

 tw.appendChild(h);
 inner.appendChild(tw);

 const bw=document.createElement('div');
 bw.className=t.bodyWrap;

 const body=document.createElement('div');
 body.className=t.body;
 container(body,s.body);

 const title=text('card-text-title','title',card.title,sz);
 const desc=text('card-text-description','description',card.description,sz);
 const price=text('card-text-price','price','$'+card.price,sz);
 const old=text('card-text-price-old','oldPrice','$'+card.oldPrice,sz);
 const part=text('card-text-extra','partNumber',card.partNumber,sz);
 const note=text('card-text-extra','extraNote',card.extraNote,sz);

 if(t.price)price.classList.add(t.price);
 desc.style.whiteSpace='pre-line';

 const top=document.createElement('div');
 top.className='card-top-wrapper';
 container(top,s.top||{d:'flex',dir:'column',j:'start',a:'stretch',gap:2});
 top.append(title,desc);

 const extra=document.createElement('div');
 extra.className='card-extra-info';
 extra.append(part,note);

 const oldWrap=document.createElement('div');
 oldWrap.className='card-old-price-wrapper';
 oldWrap.appendChild(old);

 const extraGrid=document.createElement('div');
 extraGrid.className='card-extra-info-grid';
 extraGrid.style.display='grid';
 extraGrid.style.gridTemplateColumns='1fr 1fr';
 extraGrid.style.gap=(s.body.gap||10)+'px';
 extraGrid.append(extra,oldWrap);

 const bottom=document.createElement('div');
 bottom.className='card-bottom-wrapper';
 container(bottom,s.bottom||{d:'flex',dir:'column',j:'start',a:'stretch',gap:2});
 bottom.append(price,extraGrid);

 body.append(top,bottom);
 bw.appendChild(body);
 inner.appendChild(bw);
 wrap.appendChild(inner);

 Object.keys(FIELDS).forEach(k=>{
  fieldStyle(
   {title,description,price,oldPrice:old,partNumber:part,extraNote:note}[k],
   s.fields[k]
  );
 });

 const overlay=document.createElement('div');
 overlay.className='et-card-overlay';
 overlay.innerHTML='<div class="et-card-overlay-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M20 16v4a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h4"/><polygon points="12.5 15.8 22 6.2 17.8 2 8.3 11.5 8 16 12.5 15.8"/></svg></div>';
 overlay.onclick=e=>{
  e.stopPropagation();
  openEdit(card);
 };
 wrap.appendChild(overlay);

 return wrap;
}

function fit(cardEl){
 const card=get(cardEl.dataset.cardId);
 if(!card)return;

 const top=cardEl.querySelector('.card-top-wrapper');
 if(!top)return;

 const map={
  title:'.card-text-title',
  description:'.card-text-description',
  price:'.card-text-price',
  oldPrice:'.card-text-price-old',
  partNumber:'[data-field="partNumber"]',
  extraNote:'[data-field="extraNote"]'
 };

 const cfg={
  title:[.85,.995],
  description:[.85,.995],
  price:[.55,.97],
  oldPrice:[.75,.99],
  partNumber:[.75,.99],
  extraNote:[.75,.99]
 };

 const items=[];

 Object.keys(map).forEach(k=>{
  const el=cardEl.querySelector(map[k]);
  if(!el)return;
  const s=card.style.fields[k];
  if(s&&s.fit===0)return;

  const base=s&&s.size?+s.size:parseFloat(getComputedStyle(el).fontSize)||0;

  items.push({
   el,
   floor:base*cfg[k][0],
   ratio:cfg[k][1]
  });
 });

 let n=0;

 while(top.scrollHeight>top.clientHeight+1&&n++<80){
  let changed=false;

  items.forEach(x=>{
   const cur=parseFloat(getComputedStyle(x.el).fontSize)||0;
   if(cur>x.floor){
    const next=Math.max(cur*x.ratio,x.floor);
    x.el.style.fontSize=next+'px';
    changed=true;
   }
  });

  if(!changed)break;
 }
}

function fitAll(){
 document.querySelectorAll(
  '.et-everyday-card[data-card-id],.et-clearance-card[data-card-id],.et-promo-card[data-card-id]'
 ).forEach(fit);
}

function live(id,field,value){
 const el=document.querySelector(
  '.et-everyday-card[data-card-id="'+id+'"],'+
  '.et-clearance-card[data-card-id="'+id+'"],'+
  '.et-promo-card[data-card-id="'+id+'"]'
 );

 if(el){
  const x=el.querySelector('[data-field="'+field+'"]');
  if(x)x.textContent=(field==='price'||field==='oldPrice'?'$':'')+value;
  requestAnimationFrame(()=>fit(el));
 }

 if(field==='title'||field==='partNumber'){
  const row=document.querySelector('.et-current-card[data-card-id="'+id+'"]');
  if(row){
   const a=row.querySelectorAll('.et-small-txt');
   if(field==='title'&&a[0])a[0].textContent=value;
   if(field==='partNumber'&&a[1])a[1].textContent=value;
  }
 }
}

function renderList(){
 if(!els.list)return;
 els.list.innerHTML='';

 state.cards.forEach(c=>{
  const row=document.createElement('div');
  row.className='et-current-card';
  row.dataset.cardId=c.id;

  const title=document.createElement('div');
  title.className='et-small-txt';
  title.textContent=c.title;

  const part=document.createElement('div');
  part.className='et-small-txt';
  part.textContent=c.partNumber;

  const actions=document.createElement('div');
  actions.className='et-current-card-action-wrapper';

  const edit=document.createElement('div');
  edit.className='et-action-button';
  edit.setAttribute('btn','edit');
  edit.innerHTML='<div class="et-xsmall-txt">Edit</div>';

  const del=document.createElement('div');
  del.className='et-action-button';
  del.setAttribute('btn','delete');
  del.innerHTML='<div class="et-xsmall-txt">X</div>';

  actions.append(edit,del);
  row.append(title,part,actions);
  els.list.appendChild(row);
 });
}

function render(){
 if(!els.pages)return;

 els.pages.innerHTML='';
 els.pages.style.display='flex';
 els.pages.style.flexDirection='column';
 els.pages.style.justifyContent='flex-start';
 els.pages.style.alignItems='center';

 const cap=CAPS[state.layout];
 const pages=state.cards.length?chunk(state.cards,cap):[[]];

 pages.forEach(cs=>{
  const page=document.createElement('div');
  page.className='et-page';
  page.style.width='210mm';
  page.style.height='297mm';
  page.style.boxSizing='border-box';
  page.style.overflow='hidden';

  const grid=document.createElement('div');
  grid.className='et-grid-cards '+state.layout;

  const g=GRID[state.layout];
  grid.style.display='grid';
  grid.style.gridTemplateColumns='repeat('+g[0]+',1fr)';
  grid.style.gridTemplateRows='repeat('+g[1]+',1fr)';
  grid.style.width='100%';
  grid.style.height='100%';

  cs.forEach(c=>grid.appendChild(build(c)));

  page.appendChild(grid);
  els.pages.appendChild(page);
 });

 renderList();
 requestAnimationFrame(fitAll);
}

function chunk(a,n){
 const o=[];
 for(let i=0;i<a.length;i+=n)o.push(a.slice(i,i+n));
 return o;
}

function section(title){
 const s=document.createElement('div');
 s.className='et-edit-section';
 const h=document.createElement('div');
 h.className='et-edit-section-title';
 h.textContent=title;
 s.appendChild(h);
 return s;
}

function control(label,input){
 const r=document.createElement('div');
 r.className='et-control-row';
 const l=document.createElement('div');
 l.className='et-control-label';
 l.textContent=label;
 r.append(l,input);
 return r;
}

function select(value,opts){
 const s=document.createElement('select');
 s.className='et-control';
 opts.forEach(x=>{
  const o=document.createElement('option');
  o.value=x[0];
  o.textContent=x[1];
  if(x[0]===value)o.selected=true;
  s.appendChild(o);
 });
 return s;
}

function num(value){
 const i=document.createElement('input');
 i.type='number';
 i.className='et-control et-number';
 i.value=value??'';
 return i;
}

function rebuildPanel(){
 if(!els.panel)return;
 const old=els.panel.querySelector('.et-edit-content');
 if(old)old.remove();

 const c=get(editing);
 if(!c)return;

 if(!c.style)c.style=defStyle();
 if(!c.style.fields)c.style.fields=JSON.parse(JSON.stringify(DEFAULT_FIELDS));

 const content=document.createElement('div');
 content.className='et-edit-content';

 const contentSec=section('Content');

 Object.keys(FIELDS).forEach(k=>{
  const group=document.createElement('div');
  group.className='et-field-group';

  const label=document.createElement('label');
  label.className='et-field-label';
  label.textContent=FIELDS[k];

  const input=document.createElement(k==='description'?'textarea':'input');
  input.className='et-field-input';
  input.dataset.field=k;
  input.value=c[k]??'';

  if(k==='description')input.rows=3;

  group.append(label,input);
  contentSec.appendChild(group);
 });

 content.appendChild(contentSec);

 const layoutSec=section('Card Layout');
 const b=c.style.body;

 const display=select(b.d,[['flex','Flex'],['grid','Grid']]);
 display.onchange=()=>{
  b.d=display.value;
  rebuildCard();
 };

 const direction=select(b.dir,[['column','Column'],['row','Row']]);
 direction.onchange=()=>{
  b.dir=direction.value;
  rebuildCard();
 };

 const justify=select(b.j,[['start','Start'],['center','Center'],['end','End'],['between','Space Between']]);
 justify.onchange=()=>{
  b.j=justify.value;
  rebuildCard();
 };

 const align=select(b.a,[['stretch','Stretch'],['start','Start'],['center','Center'],['end','End']]);
 align.onchange=()=>{
  b.a=align.value;
  rebuildCard();
 };

 const gap=num(b.gap);
 gap.oninput=()=>{
  b.gap=+gap.value||0;
  rebuildCard();
 };

 layoutSec.append(
  control('Display',display),
  control('Direction',direction),
  control('Justify',justify),
  control('Align',align),
  control('Gap',gap)
 );

 content.appendChild(layoutSec);

 const fieldsSec=section('Elements');

 Object.keys(FIELDS).forEach(k=>{
  const s=c.style.fields[k];
  const box=document.createElement('div');
  box.className='et-field-editor';

  const head=document.createElement('div');
  head.className='et-field-editor-header';

  const name=document.createElement('div');
  name.className='et-field-editor-name';
  name.textContent=FIELDS[k];

  const toggle=document.createElement('button');
  toggle.type='button';
  toggle.className='et-field-editor-toggle';
  toggle.textContent='Options';

  const body=document.createElement('div');
  body.className='et-field-editor-body';

  toggle.onclick=()=>box.classList.toggle('open');

  const visible=document.createElement('input');
  visible.type='checkbox';
  visible.className='et-checkbox';
  visible.checked=!!s.v;
  visible.onchange=()=>{
   s.v=visible.checked?1:0;
   rebuildCard();
  };

  const fit=document.createElement('input');
  fit.type='checkbox';
  fit.className='et-checkbox';
  fit.checked=s.fit!==0;
  fit.onchange=()=>{
   s.fit=fit.checked?1:0;
   rebuildCard();
  };

  const size=num(s.size||'');
  size.placeholder='CSS default';
  size.oninput=()=>{
   s.size=size.value===''?null:+size.value;
   rebuildCard();
  };

  const line=num(s.line||'');
  line.step='.05';
  line.placeholder='1.15';
  line.oninput=()=>{
   s.line=line.value===''?null:+line.value;
   rebuildCard();
  };

  const align=select(s.a,[['left','Left'],['center','Center'],['right','Right']]);
  align.onchange=()=>{
   s.a=align.value;
   rebuildCard();
  };

  body.append(
   control('Visible',visible),
   control('Font Size',size),
   control('Line Height',line),
   control('Alignment',align),
   control('Auto Fit',fit)
  );

  head.append(name,toggle);
  box.append(head,body);
  fieldsSec.appendChild(box);
 });

 content.appendChild(fieldsSec);

 els.panel.insertBefore(content,els.panel.querySelector('.et-edit-panel-footer'));
}

function rebuildCard(){
 const c=get(editing);
 if(!c)return;

 const old=document.querySelector(
  '.et-everyday-card[data-card-id="'+c.id+'"],'+
  '.et-clearance-card[data-card-id="'+c.id+'"],'+
  '.et-promo-card[data-card-id="'+c.id+'"]'
 );

 if(old){
  const n=build(c);
  old.replaceWith(n);
  requestAnimationFrame(()=>fit(n));
 }
}

function buildPanel(){
 if(els.panel)return els.panel;

 const p=document.createElement('div');
 p.className='et-edit-panel';

 p.innerHTML=`
  <div class="et-edit-panel-header">
   <div class="et-edit-panel-title">Edit Card</div>
   <button type="button" class="et-edit-panel-close" btn="close">×</button>
  </div>
  <div class="et-edit-panel-body"></div>
  <div class="et-edit-panel-footer">
   <button type="button" class="et-edit-button" btn="reset">Reset Layout</button>
   <div>
    <button type="button" class="et-edit-button" btn="copy">Copy</button>
    <button type="button" class="et-edit-button primary" btn="save">Done</button>
   </div>
  </div>
 `;

 p.onclick=e=>{
  const a=e.target.closest('[btn]');
  if(!a)return;

  const x=a.getAttribute('btn');

  if(x==='close'||x==='save')hideEdit();
  if(x==='copy')duplicate();
  if(x==='reset')resetLayout();
 };

 p.oninput=e=>{
  const f=e.target.dataset.field;
  if(!f)return;

  const c=get(editing);
  if(!c)return;

  c[f]=e.target.value;
  live(c.id,f,e.target.value);
 };

 document.body.appendChild(p);
 els.panel=p;
 return p;
}

function positionPanel(){
 if(!els.panel)return;

 if(els.header){
  const r=els.header.getBoundingClientRect();
  els.panel.style.top=Math.max(8,r.top)+'px';
  els.panel.style.left=(r.right+16)+'px';
 }else{
  els.panel.style.top='20px';
  els.panel.style.right='20px';
 }
}

function openEdit(c){
 if(!c)return;

 buildPanel();
 editing=c.id;

 rebuildPanel();
 positionPanel();

 els.panel.style.display='block';
}

function hideEdit(){
 if(els.panel)els.panel.style.display='none';
 editing=null;
}

function resetLayout(){
 const c=get(editing);
 if(!c)return;

 c.style=defStyle();
 rebuildPanel();
 rebuildCard();
}

function duplicate(){
 const c=get(editing);
 if(!c)return;

 const x=JSON.parse(JSON.stringify(c));
 delete x.id;

 const n=add(x);
 openEdit(n);
}

function injectStyles(){
 if(document.getElementById('et-new-style'))return;

 const s=document.createElement('style');
 s.id='et-new-style';

 s.textContent=`
 .et-everyday-card,.et-clearance-card,.et-promo-card{
  display:flex!important;
  flex-direction:column!important;
  height:100%!important;
  box-sizing:border-box!important;
  overflow:hidden!important
 }
 .everyday-card,.clearance-card,.promo-card{
  flex:1 1 auto!important;
  min-height:0!important;
  display:flex!important;
  flex-direction:column!important;
  box-sizing:border-box!important
 }
 .everyday-card-body-wrapper,.clearance-card-body-wrapper,.promo-card-body-wrapper{
  flex:1 1 auto!important;
  min-height:0!important;
  display:flex!important;
  flex-direction:column!important
 }
 .everyday-card-body,.clearance-card-body,.promo-card-body{
  flex:1 1 auto!important;
  min-height:0!important;
  height:100%!important;
  box-sizing:border-box!important
 }
 .card-top-wrapper{
  flex:1 1 auto!important;
  min-height:0!important;
  overflow:hidden!important
 }
 .card-bottom-wrapper{
  flex:0 0 auto!important;
  margin-top:auto!important
 }
 .card-text-title,.card-text-description,.card-text-price,
 .card-text-price-old,.card-text-extra{
  margin:0!important
 }
 .card-extra-info,.card-old-price-wrapper{
  min-width:0
 }
 .et-page{
  background:#fff;
  box-shadow:0 0 0 1px rgba(0,0,0,.08),0 4px 16px rgba(0,0,0,.08);
  margin-bottom:24px
 }
 .et-card-overlay{
  position:absolute;
  inset:0;
  display:flex;
  align-items:center;
  justify-content:center;
  background:rgba(0,0,0,.55);
  opacity:0;
  transition:opacity .2s;
  cursor:pointer;
  z-index:999
 }
 .et-card-overlay:hover{opacity:1}
 .et-card-overlay-icon svg{width:32px;height:32px;color:#fff}
 .et-everyday-card:hover .everyday-card,
 .et-clearance-card:hover .clearance-card,
 .et-promo-card:hover .promo-card{
  filter:blur(2px) grayscale(90%)
 }
 .H2-text-card-white{color:#fff!important;font-size:32px;line-height:29px}
 .H2-text-card-black{color:#000!important;font-size:32px;line-height:29px}
 .et-edit-panel{
  display:none;
  position:fixed;
  width:340px;
  max-height:90vh;
  overflow-y:auto;
  background:#fff;
  border:1px solid #ddd;
  border-radius:8px;
  box-shadow:0 12px 40px rgba(0,0,0,.2);
  padding:16px;
  z-index:99999;
  box-sizing:border-box
 }
 .et-edit-panel-header{
  display:flex;
  justify-content:space-between;
  align-items:center;
  margin-bottom:12px;
  position:sticky;
  top:-16px;
  background:#fff;
  padding-top:16px;
  z-index:2
 }
 .et-edit-panel-title{font-weight:700;font-size:16px}
 .et-edit-panel-close{
  border:0;background:none;font-size:22px;cursor:pointer
 }
 .et-edit-section{
  border-top:1px solid #eee;
  padding-top:12px;
  margin-top:12px
 }
 .et-edit-section-title{
  font-size:11px;
  font-weight:700;
  text-transform:uppercase;
  margin-bottom:10px
 }
 .et-field-group{margin-bottom:10px}
 .et-field-label,.et-control-label{
  display:block;
  font-size:11px;
  font-weight:600;
  color:#444;
  margin-bottom:4px
 }
 .et-field-input{
  width:100%;
  box-sizing:border-box;
  padding:7px;
  border:1px solid #ccc;
  border-radius:5px;
  font:inherit;
  font-size:12px
 }
 textarea.et-field-input{resize:vertical}
 .et-control-row{
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:8px;
  margin-bottom:7px
 }
 .et-control{
  min-width:110px;
  padding:5px;
  border:1px solid #ccc;
  border-radius:5px;
  background:#fff;
  font:inherit;
  font-size:11px
 }
 .et-number{width:80px;min-width:80px}
 .et-checkbox{width:16px;height:16px}
 .et-field-editor{
  border:1px solid #e5e5e5;
  border-radius:6px;
  padding:8px;
  margin-bottom:6px
 }
 .et-field-editor-header{
  display:flex;
  align-items:center;
  justify-content:space-between
 }
 .et-field-editor-name{font-size:12px;font-weight:700}
 .et-field-editor-toggle{
  border:0;
  background:none;
  cursor:pointer;
  font-size:10px
 }
 .et-field-editor-body{
  display:none;
  padding-top:8px
 }
 .et-field-editor.open .et-field-editor-body{display:block}
 .et-edit-panel-footer{
  display:flex;
  justify-content:space-between;
  align-items:center;
  gap:8px;
  margin-top:14px;
  padding-top:12px;
  border-top:1px solid #eee;
  position:sticky;
  bottom:-16px;
  padding-bottom:16px;
  background:#fff
 }
 .et-edit-button{
  border:1px solid #ccc;
  background:#fff;
  border-radius:5px;
  padding:7px 10px;
  cursor:pointer;
  font-size:11px;
  font-weight:600
 }
 .et-edit-button.primary{
  background:#111;
  color:#fff;
  border-color:#111
 }

 @media print{
  @page{size:A4;margin:0}
  *{
   -webkit-print-color-adjust:exact!important;
   print-color-adjust:exact!important
  }
  body *{visibility:hidden!important}
  .et-card-body-wrapper,.et-card-body-wrapper *{
   visibility:visible!important
  }
  .et-card-body-wrapper{
   position:absolute!important;
   top:0!important;
   left:0!important;
   width:auto!important;
   height:auto!important;
   padding:0!important;
   overflow:visible!important;
   display:block!important;
   background:transparent
  }
  .et-card-overlay,.et-edit-panel{display:none!important}
  .et-page{
   width:210mm!important;
   height:297mm!important;
   margin:0!important;
   padding:0!important;
   overflow:hidden!important;
   box-shadow:none!important;
   border:0!important;
   outline:0!important;
   transform:scale(.97);
   transform-origin:center center;
   page-break-after:always;
   break-after:page
  }
  .et-page:last-child{
   page-break-after:auto;
   break-after:auto
  }
  .et-grid-cards{
   width:100%!important;
   height:100%!important;
   margin:0!important;
   border:0!important;
   outline:0!important;
   box-shadow:none!important
  }
  .et-everyday-card,.et-clearance-card,.et-promo-card,
  .everyday-card,.clearance-card,.promo-card{
   width:100%!important;
   height:100%!important;
   border:0!important;
   outline:0!important
  }
  .w-webflow-badge,
  [class*="webflow-badge"],
  a[href*="webflow.com?utm"]{
   display:none!important;
   visibility:hidden!important
  }
 }
 `;

 document.head.appendChild(s);
}

function scroll(el){
 if(!el)return;
 el.style.overflowY='auto';
 el.style.overscrollBehavior='contain';
}

function init(){
 cache();
 injectStyles();
 buildPanel();

 if(els.type){
  els.type.value=state.type;
  els.type.onchange=e=>{
   state.type=e.target.value;
   state.cards=[];
   add();
  };
 }

 if(els.layout){
  els.layout.value=state.layout;
  els.layout.onchange=e=>{
   state.layout=e.target.value;
   render();
  };
 }

 if(els.list){
  els.list.onclick=e=>{
   const row=e.target.closest('[data-card-id]');
   const btn=e.target.closest('[btn]');
   if(!row||!btn)return;

   const id=row.dataset.cardId;
   const action=btn.getAttribute('btn');

   if(action==='edit')openEdit(get(id));
   if(action==='delete')del(id);
  };
 }

 if(els.add){
  els.add.onclick=()=>{
   const c=add();
   openEdit(c);
  };
 }

 if(els.print){
  els.print.onclick=()=>window.print();
 }

 scroll(els.pages);
 scroll(els.list);

 window.addEventListener('resize',()=>{
  if(els.panel&&els.panel.style.display!=='none')positionPanel();
  requestAnimationFrame(fitAll);
 });

 window.addEventListener('beforeprint',()=>{
  let x=els.pages;
  while(x&&x!==document.body){
   x.style.setProperty('overflow','visible','important');
   x.style.setProperty('height','auto','important');
   x.style.setProperty('max-height','none','important');
   x=x.parentElement;
  }
 });

 add();
}

document.addEventListener('DOMContentLoaded',init);

window.ETPricingTool={
 state,
 addCard:add,
 deleteCard:del,
 getCard:get,
 render,
 showEditPanel:openEdit,
 hideEditPanel:hideEdit
};

})();
</script>
