export default async function (page, base = "http://localhost:4180/update-test/") {
  const check=(value,message)=>{if(!value)throw new Error(message);};
  const banner=page.getByRole("region",{name:"È disponibile una nuova versione"});
  const changeRelease=async version=>{
    const result=await page.request.post(base+"__test/release?version="+version);
    check(result.ok(),"Cambio release fixture");
    await page.evaluate(async()=>{const r=await navigator.serviceWorker.ready;await r.update();});
    await banner.waitFor({state:"visible"});
  };
  const read=()=>page.evaluate(async()=>(await import(new URL("./src/storage.js",location.href))).load());
  await page.request.post(base+"__test/release?version=A");
  await page.goto(base);
  await page.getByRole("heading",{name:"I tuoi salvadanai"}).waitFor();
  await page.waitForFunction(()=>!!navigator.serviceWorker.controller);
  check(!(await banner.isVisible()),"Nessun banner al primo caricamento");
  await page.getByRole("button",{name:"＋ Aggiungi risparmi",exact:true}).click();
  await page.getByLabel("Importo in euro",{exact:true}).fill("123");
  await page.getByRole("button",{name:"Conferma versamento",exact:true}).click();
  await page.locator("dialog").waitFor({state:"hidden"});
  const original=await read();
  await changeRelease("B");
  await page.waitForTimeout(6500);
  check(await banner.isVisible(),"Il banner non deve sparire con il timeout del toast");
  check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),"Banner senza overflow");
  await page.getByRole("button",{name:"Più tardi",exact:true}).click();
  check(!(await banner.isVisible()),"Più tardi nasconde il banner nella sessione");
  check(JSON.stringify(await read())===JSON.stringify(original),"Rinvio non modifica i dati");
  await page.reload();
  await page.getByRole("heading",{name:"I tuoi salvadanai"}).waitFor();
  await banner.waitFor({state:"visible"});
  check(await page.getByRole("button",{name:"Aggiorna ora",exact:true}).isEnabled(),"Banner torna alla riapertura");
  const other=await page.context().newPage();
  await other.goto(base);
  await other.getByRole("button",{name:"＋ Aggiungi risparmi",exact:true}).click();
  await other.getByLabel("Importo in euro",{exact:true}).fill("99");
  let otherReloaded=false; other.on("framenavigated",frame=>{if(frame===other.mainFrame())otherReloaded=true;});
  const navigation=page.waitForEvent("load");
  await page.getByRole("button",{name:"Aggiorna ora",exact:true}).click();
  await navigation;
  await page.getByRole("heading",{name:"I tuoi salvadanai"}).waitFor();
  check(!(await banner.isVisible()),"Banner rimosso dopo attivazione");
  check(JSON.stringify(await read())===JSON.stringify(original),"Aggiornamento conserva il registro");
  check(!otherReloaded,"Nessun reload forzato nell’altra scheda");
  check(await other.getByLabel("Importo in euro",{exact:true}).inputValue()==="99","Modulo aperto nell’altra scheda preservato");
  await other.close();
  await page.evaluate(async()=>{await (await navigator.serviceWorker.ready).update();});
  check(!(await banner.isVisible()),"Nessun avviso senza nuova release");
  await changeRelease("C");
  await page.getByRole("button",{name:"＋ Aggiungi risparmi",exact:true}).click();
  await page.getByLabel("Importo in euro",{exact:true}).fill("1");
  // Keep the real IndexedDB transaction pending to verify the busy guard.
  await page.evaluate(()=>{
    const originalPut=IDBObjectStore.prototype.put;
    let released=false,started=false;
    IDBObjectStore.prototype.put=function(...args){
      if(this.name!=="register")return originalPut.apply(this,args);
      const store=this;
      const keepAlive=()=>{
        const req=store.get("state");
        req.onsuccess=()=>{
          if(released){originalPut.apply(store,args);IDBObjectStore.prototype.put=originalPut;}
          else keepAlive();
        };
      };
      keepAlive();started=true;
      window.releaseUpdateTestSave=()=>{released=true;};
      return undefined;
    };
    window.updateTestSaveStarted=()=>started;
  });
  await page.getByRole("button",{name:"Conferma versamento",exact:true}).click();
  await page.waitForFunction(()=>window.updateTestSaveStarted());
  check(await page.locator('#update-banner [data-action="update"]').isDisabled(),"Aggiornamento disabilitato durante il salvataggio");
  await page.evaluate(()=>window.releaseUpdateTestSave());
  await page.locator("dialog").waitFor({state:"hidden"});
  check((await read()).free===12400,"Versamento completato prima dell’aggiornamento");
  await page.getByRole("button",{name:"Più tardi",exact:true}).click();
  await page.getByRole("button",{name:"Impostazioni e backup",exact:true}).click();
  const navigation2=page.waitForEvent("load");
  await page.getByRole("button",{name:"Installa aggiornamento disponibile",exact:true}).click();
  await navigation2;
  await page.getByRole("heading",{name:"I tuoi salvadanai"}).waitFor();
  check((await read()).free===12400,"Aggiornamento dalle impostazioni conserva il nuovo saldo");
  return {passed:["primo avvio senza banner","banner persistente","rinvio e ricomparsa","attivazione reale B e C","registro preservato","altra scheda non interrotta","salvataggio non interrotto","aggiornamento dalle impostazioni"],viewport:page.viewportSize()};
}
