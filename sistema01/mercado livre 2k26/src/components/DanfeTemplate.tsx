import React from "react";
import type { Order } from "../contexts/StoreContext";

export const DanfeTemplate = React.forwardRef<HTMLDivElement, { order: Order, country?: string }>(({ order, country = "BR" }, ref) => {
  const parsedItems = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
  
  let paymentParsed: any = {};
  if (order.notes) {
    try {
      paymentParsed = JSON.parse(order.notes);
    } catch(e) {}
  }

  // Helper variables for Danfe
  
  const ML_INFO: Record<string, any> = {
    BR: { nome: "Ebazar.com.br LTDA", doc: "03.007.331/0001-41", docType: "CNPJ", addr: "Av das Nacoes Unidas, 3003", city: "Osasco", uf: "SP", isento: "ISENTO", prodTit: "DADOS DO PRODUTO / SERVIÇO" },
    AR: { nome: "MercadoLibre S.R.L", doc: "30-70308853-4", docType: "CUIT", addr: "Av. Caseros 3039", city: "Buenos Aires", uf: "AR", isento: "EXENTO", prodTit: "DATOS DEL PRODUCTO" },
    MX: { nome: "MercadoLibre, S. de R.L. de C.V.", doc: "MER9912015W6", docType: "RFC", addr: "Insurgentes Sur 1602", city: "Mexico", uf: "MX", isento: "EXENTO", prodTit: "DATOS DEL PRODUCTO" },
    CL: { nome: "MercadoLibre Chile Ltda", doc: "77.060.793-6", docType: "RUT", addr: "Av. Apoquindo 4800", city: "Santiago", uf: "CL", isento: "EXENTO", prodTit: "DATOS DEL PRODUCTO" },
    CO: { nome: "MercadoLibre Colombia LTDA", doc: "830.063.131-0", docType: "NIT", addr: "Cra 11 # 98-07", city: "Bogota", uf: "CO", isento: "EXENTO", prodTit: "DATOS DEL PRODUCTO" }
  };
  const activeML = ML_INFO[country] || ML_INFO['BR'];

  const emitenteNome = activeML.nome;
  const emitenteCNPJ = activeML.doc;
  const emitenteEndereco = activeML.addr;
  const emitenteCidade = activeML.city;
  const emitenteUF = activeML.uf;
  const prodTitleArea = activeML.prodTit;

  const emitenteIE = "123.456.789.000";
  const emitenteCEP = "00000-000";
  const emitenteTelefone = "(11) 90000-0000";

  const chaveAcesso = `3523 0400 0000 0000 0199 5500 1000 ${String(order.id).padStart(9, '0').substring(0, 9)} 1234 5678`;
  const protocolo = `135${Date.now().toString().substring(0, 12)} ${new Date().toLocaleTimeString('pt-BR')}`;

  const total = order.total || 0;
  
  const formattedItems = (parsedItems && Array.isArray(parsedItems) ? parsedItems : []).map(i => ({
    ...i,
    ncm: "0000.00.00",
    cst: "0102",
    cfop: "5102",
    un: "UN",
    price: parseFloat(i.price) || 0,
    qty: i.quantity || 1
  }));

  const cell = "border border-black px-1 min-h-[5mm] text-[9px] uppercase leading-tight relative";
  const label = "block text-[6px] text-black font-semibold absolute top-[1px] tracking-tight uppercase";
  const value = "block mt-[8px] font-bold text-black text-[9px] truncate max-w-full truncate overflow-hidden";
  const title = "font-bold text-[8px] mb-[-1px] uppercase";

  return (
    <div ref={ref} className="w-[210mm] min-h-[297mm] p-[5mm] bg-white text-black font-sans box-border">
      
      {/* HEADER SECTION */}
      <div className="flex w-full mb-[1mm]">
         {/* Emitente Info */}
         <div className="w-[100mm] border border-black p-1 text-center relative flex justify-center items-center">
            <div className="flex flex-col items-center">
               <h1 className="font-bold text-[13px] uppercase">{emitenteNome}</h1>
               <span className="text-[9px] uppercase mt-1">{emitenteEndereco}</span>
               <span className="text-[9px] uppercase">{emitenteCidade} - {emitenteUF}</span>
               <span className="text-[9px] uppercase">CEP: {emitenteCEP} Fone: {emitenteTelefone}</span>
            </div>
         </div>
         
         {/* Danfe Middle Box */}
         <div className="w-[35mm] border-y border-r border-black p-1 text-center flex flex-col justify-between items-center relative">
            <h2 className="font-bold text-[14px]">DANFE</h2>
            <div className="text-[7px]">Documento Auxiliar da<br/>Nota Fiscal Eletrônica</div>
            <div className="grid grid-cols-2 text-[8px] mt-1 gap-1 border border-black w-[90%] p-1">
                <div className="text-right">0 - Entrada<br/>1 - Saída</div>
                <div className="font-bold text-[12px] flex items-center border border-black justify-center">1</div>
            </div>
            <div className="text-[8px] mt-1 font-bold">
               Nº {String(order.id).padStart(9, '0').substring(0, 9)}<br/>
               SÉRIE: 1<br/>
               Página 1 de 1
            </div>
         </div>

         {/* Chave de Acesso Box */}
         <div className="flex-1 flex flex-col">
             <div className="h-[25mm] border-y border-r border-black p-1 flex items-center justify-center relative">
                 <div className="text-[7px] text-left absolute top-[1px] left-[1px]">CONTROLE DO FISCO</div>
                 {/* Fake Barcode Simulator */}
                 <div className="w-[90%] h-[12mm] bg-black/80 flex">
                     {/* Faking stripes since we dont have a barcode library */}
                     {Array(70).fill(0).map((_, i) => (
                         <div key={i} className={`h-full bg-white ${i%2==0 ? 'w-[1.5px]' : i%3==0 ? 'w-[3px]' : 'w-[1px]'} ${i%5==0 ? 'hidden' : ''}`} style={{marginLeft: `${Math.random()}px`}}></div>
                     ))}
                 </div>
             </div>
             <div className="h-[10mm] border-b border-r border-black p-1 text-center relative">
                 <span className={label}>CHAVE DE ACESSO</span>
                 <span className="mt-[2px] block font-bold tracking-wider text-[11px]">{chaveAcesso}</span>
             </div>
             <div className="flex-1 border-b border-r border-black p-1 flex items-center justify-center">
                 <span className="text-[8px] text-center">Consulta de autenticidade no portal nacional da NF-e<br/>www.nfe.fazenda.gov.br/portal ou no site da Sefaz Autorizadora</span>
             </div>
         </div>
      </div>

      <div className="flex w-full mb-[1mm]">
         <div className="flex-1 border border-black p-1 relative">
            <span className={label}>NATUREZA DA OPERAÇÃO</span>
            <span className={value}>VENDA DE MERCADORIA ADQUIRIDA OU RECEBIDA DE TERCEIROS</span>
         </div>
         <div className="w-[85mm] border-y border-r border-black p-1 relative">
            <span className={label}>PROTOCOLO DE AUTORIZAÇÃO DE USO</span>
            <span className={value}>{protocolo}</span>
         </div>
      </div>

      <div className="flex w-full mb-[2mm]">
         <div className="w-[70mm] border border-black p-1 relative">
            <span className={label}>INSCRIÇÃO ESTADUAL</span>
            <span className={value}>{emitenteIE}</span>
         </div>
         <div className="w-[70mm] border-y border-r border-black p-1 relative">
            <span className={label}>INSC. ESTADUAL DO SUBST. TRIB.</span>
            <span className={value}></span>
         </div>
         <div className="flex-1 border-y border-r border-black p-1 relative">
            <span className={label}>CNPJ</span>
            <span className={value}>{emitenteCNPJ}</span>
         </div>
      </div>

      {/* DESTINATÁRIO / REMETENTE */}
      <h3 className={title}>DESTINATÁRIO / REMETENTE</h3>
      <div className="flex w-full mb-[-1px]">
         <div className="flex-1 border border-black p-1 relative">
            <span className={label}>NOME / RAZÃO SOCIAL</span>
            <span className={value}>{order.customer_name || "CLIENTE CONSUMIDOR"}</span>
         </div>
         <div className="w-[40mm] border-y border-r border-black p-1 relative">
            <span className={label}>CNPJ/CPF</span>
            <span className={value}>{paymentParsed.cardCpf || "000.000.000-00"}</span>
         </div>
         <div className="w-[30mm] border-y border-r border-black p-1 relative px-2">
            <span className={label}>DATA DA EMISSÃO</span>
            <span className={value + " text-center"}>{new Date(order.created_at).toLocaleDateString('pt-BR')}</span>
         </div>
      </div>
      <div className="flex w-full mb-[-1px]">
         <div className="flex-1 border-x border-b border-black p-1 relative">
            <span className={label}>ENDEREÇO</span>
            <span className={value}>{order.shipping_address || "NÃO INFORMADO"}</span>
         </div>
         <div className="w-[40mm] border-b border-r border-black p-1 relative">
            <span className={label}>BAIRRO / DISTRITO</span>
            <span className={value}>{order.shipping_city || ""}</span>
         </div>
         <div className="w-[30mm] border-b border-r border-black p-1 relative px-2">
            <span className={label}>CEP</span>
            <span className={value + " text-center"}>{(order.shipping_zip || "").padEnd(9,'0').substring(0,9)}</span>
         </div>
         <div className="w-[30mm] border-b border-r border-black p-1 relative px-2">
            <span className={label}>DATA SAÍDA/ENTRADA</span>
            <span className={value + " text-center"}>{new Date(order.created_at).toLocaleDateString('pt-BR')}</span>
         </div>
      </div>
      <div className="flex w-full mb-[2mm]">
         <div className="flex-1 border-x border-b border-black p-1 relative">
            <span className={label}>MUNICÍPIO</span>
            <span className={value}>{order.shipping_city || "NÃO INFORMADO"}</span>
         </div>
         <div className="w-[35mm] border-b border-r border-black p-1 relative px-2">
            <span className={label}>FONE / FAX</span>
            <span className={value + " text-center"}>{order.customer_phone}</span>
         </div>
         <div className="w-[10mm] border-b border-r border-black p-1 relative px-2">
            <span className={label}>UF</span>
            <span className={value + " text-center"}>{order.shipping_state || "SP"}</span>
         </div>
         <div className="w-[45mm] border-b border-r border-black p-1 relative px-2">
            <span className={label}>INSCRIÇÃO ESTADUAL</span>
            <span className={value}>ISENTO</span>
         </div>
         <div className="w-[30mm] border-b border-r border-black p-1 relative px-2">
            <span className={label}>HORA DE SAÍDA</span>
            <span className={value + " text-center"}>{new Date(order.created_at).toLocaleTimeString('pt-BR')}</span>
         </div>
      </div>

      {/* CÁLCULO DO IMPOSTO */}
      <h3 className={title}>CÁLCULO DO IMPOSTO</h3>
      <div className="flex w-full mb-[-1px]">
         <div className="w-[18%] border border-black p-1 relative px-2">
            <span className={label}>BASE DE CÁLCULO DO ICMS</span>
            <span className={value + " text-right"}>0,00</span>
         </div>
         <div className="w-[18%] border-y border-r border-black p-1 relative px-2">
            <span className={label}>VALOR DO ICMS</span>
            <span className={value + " text-right"}>0,00</span>
         </div>
         <div className="w-[18%] border-y border-r border-black p-1 relative px-2">
            <span className={label}>BASE DE CÁLCULO ICMS S.T.</span>
            <span className={value + " text-right"}>0,00</span>
         </div>
         <div className="w-[18%] border-y border-r border-black p-1 relative px-2">
            <span className={label}>VALOR DO ICMS S.T.</span>
            <span className={value + " text-right"}>0,00</span>
         </div>
         <div className="flex-1 border-y border-r border-black p-1 relative px-2">
            <span className={label}>VALOR TOTAL DOS PRODUTOS</span>
            <span className={value + " text-right"}>{total.toFixed(2).replace('.',',')}</span>
         </div>
      </div>
      <div className="flex w-full mb-[2mm]">
         <div className="w-[18%] border-x border-b border-black p-1 relative px-2">
            <span className={label}>VALOR DO FRETE</span>
            <span className={value + " text-right"}>0,00</span>
         </div>
         <div className="w-[18%] border-b border-r border-black p-1 relative px-2">
            <span className={label}>VALOR DO SEGURO</span>
            <span className={value + " text-right"}>0,00</span>
         </div>
         <div className="w-[18%] border-b border-r border-black p-1 relative px-2">
            <span className={label}>DESCONTO</span>
            <span className={value + " text-right"}>0,00</span>
         </div>
         <div className="w-[18%] border-b border-r border-black p-1 relative px-2">
            <span className={label}>OUTRAS DESPESAS ACESSÓRIAS</span>
            <span className={value + " text-right"}>0,00</span>
         </div>
         <div className="w-[18%] border-b border-r border-black p-1 relative px-2">
            <span className={label}>VALOR DO IPI</span>
            <span className={value + " text-right"}>0,00</span>
         </div>
         <div className="flex-1 border-b border-r border-black p-1 relative px-2">
            <span className={label}>VALOR TOTAL DA NOTA</span>
            <span className={value + " text-right font-black"}>{total.toFixed(2).replace('.',',')}</span>
         </div>
      </div>

      {/* TRANSPORTADOR / VOLUMES */}
      <h3 className={title}>TRANSPORTADOR / VOLUMES TRANSPORTADOS</h3>
      <div className="flex w-full mb-[-1px]">
         <div className="flex-1 border border-black p-1 relative">
            <span className={label}>RAZÃO SOCIAL</span>
            <span className={value}>O MESMO</span>
         </div>
         <div className="w-[30mm] border-y border-r border-black p-1 relative px-2">
            <span className={label}>FRETE POR CONTA</span>
            <span className={value + " text-center"}>0-Emitente</span>
         </div>
         <div className="w-[30mm] border-y border-r border-black p-1 relative px-2">
            <span className={label}>CÓDIGO ANTT</span>
            <span className={value}></span>
         </div>
         <div className="w-[30mm] border-y border-r border-black p-1 relative px-2">
            <span className={label}>PLACA DO VEÍCULO</span>
            <span className={value}></span>
         </div>
         <div className="w-[15mm] border-y border-r border-black p-1 relative px-2">
            <span className={label}>UF</span>
            <span className={value}></span>
         </div>
         <div className="w-[35mm] border-y border-r border-black p-1 relative px-2">
            <span className={label}>CNPJ/CPF</span>
            <span className={value}></span>
         </div>
      </div>
      <div className="flex w-full mb-[2mm]">
         <div className="w-[20mm] border-x border-b border-black p-1 relative px-2">
            <span className={label}>QUANTIDADE</span>
            <span className={value}>1</span>
         </div>
         <div className="w-[35mm] border-b border-r border-black p-1 relative px-2">
            <span className={label}>ESPÉCIE</span>
            <span className={value}>VOLUMES</span>
         </div>
         <div className="w-[35mm] border-b border-r border-black p-1 relative px-2">
            <span className={label}>MARCA</span>
            <span className={value}></span>
         </div>
         <div className="flex-1 border-b border-r border-black p-1 relative px-2">
            <span className={label}>NUMERAÇÃO</span>
            <span className={value}></span>
         </div>
         <div className="w-[30mm] border-b border-r border-black p-1 relative px-2">
            <span className={label}>PESO BRUTO</span>
            <span className={value + " text-right"}>1,000</span>
         </div>
         <div className="w-[30mm] border-b border-r border-black p-1 relative px-2">
            <span className={label}>PESO LÍQUIDO</span>
            <span className={value + " text-right"}>1,000</span>
         </div>
      </div>

      {/* DADOS DO PRODUTO */}
      <h3 className={title}>{prodTitleArea}</h3>
      <div className="border border-black mb-[2mm]">
         <table className="w-full text-[7.5px] border-collapse">
            <thead>
               <tr className="border-b border-black text-left">
                  <th className="font-semibold p-[2px] border-r border-black text-center">CÓD. PROD.</th>
                  <th className="font-semibold p-[2px] border-r border-black">DESCRIÇÃO DO PRODUTO/SERVIÇO</th>
                  <th className="font-semibold p-[2px] border-r border-black text-center">NCM/SH</th>
                  <th className="font-semibold p-[2px] border-r border-black text-center">CST</th>
                  <th className="font-semibold p-[2px] border-r border-black text-center">CFOP</th>
                  <th className="font-semibold p-[2px] border-r border-black text-center">UNID.</th>
                  <th className="font-semibold p-[2px] border-r border-black text-center">QUANT.</th>
                  <th className="font-semibold p-[2px] border-r border-black text-right">V. UNIT.</th>
                  <th className="font-semibold p-[2px] border-r border-black text-right">V. TOTAL</th>
                  <th className="font-semibold p-[2px] border-r border-black text-right">BC ICMS</th>
                  <th className="font-semibold p-[2px] border-r border-black text-right">V. ICMS</th>
                  <th className="font-semibold p-[2px] border-r border-black text-right">V. IPI</th>
                  <th className="font-semibold p-[2px] border-r border-black text-center">ALQ. ICMS</th>
                  <th className="font-semibold p-[2px] text-center">ALQ. IPI</th>
               </tr>
            </thead>
            <tbody>
               {formattedItems.map((item, idx) => (
                  <tr key={idx} className={idx < formattedItems.length - 1 ? "border-b border-black/30" : ""}>
                     <td className="p-[2px] border-r border-black/30 text-center">{String(item.product_id).substring(0,6)}</td>
                     <td className="p-[2px] border-r border-black/30 truncate max-w-[50mm] uppercase">{item.name}</td>
                     <td className="p-[2px] border-r border-black/30 text-center">{item.ncm}</td>
                     <td className="p-[2px] border-r border-black/30 text-center">{item.cst}</td>
                     <td className="p-[2px] border-r border-black/30 text-center">{item.cfop}</td>
                     <td className="p-[2px] border-r border-black/30 text-center">{item.un}</td>
                     <td className="p-[2px] border-r border-black/30 text-center">{item.qty}</td>
                     <td className="p-[2px] border-r border-black/30 text-right">{item.price.toFixed(2).replace('.',',')}</td>
                     <td className="p-[2px] border-r border-black/30 text-right">{(item.price * item.qty).toFixed(2).replace('.',',')}</td>
                     <td className="p-[2px] border-r border-black/30 text-right">0,00</td>
                     <td className="p-[2px] border-r border-black/30 text-right">0,00</td>
                     <td className="p-[2px] border-r border-black/30 text-right">0,00</td>
                     <td className="p-[2px] border-r border-black/30 text-center">0,00</td>
                     <td className="p-[2px] text-center">0,00</td>
                  </tr>
               ))}
               <tr><td colSpan={14} className="h-[20px]"></td></tr>
            </tbody>
         </table>
      </div>

      {/* DADOS ADICIONAIS */}
      <h3 className={title}>DADOS ADICIONAIS</h3>
      <div className="flex w-full mb-[2mm]">
         <div className="w-[60%] border border-black p-1 relative h-[30mm]">
            <span className={label}>INFORMAÇÕES COMPLEMENTARES</span>
            <p className="mt-[8px] text-[8px] leading-tight font-medium">
               COMPRADO POR: {order.customer_name || ""} / DOC: {paymentParsed.cardCpf || ""} <br/>
               FORM DE PAGAMENTO: {order.payment_method.toUpperCase()}<br/>
               DOCUMENTO REFERENTE A PEDIDO E-COMMERCE SEM VALOR FISCAL DE VENDA. <br/>
               VENDEDOR: MEI - ISENTO DE INSCRIÇÃO.
            </p>
         </div>
         <div className="w-[40%] border-y border-r border-black p-1 relative h-[30mm]">
            <span className={label}>RESERVADO AO FISCO</span>
         </div>
      </div>
      
    </div>
  );
});
