    // =====================================================================
    // Regional succession (inheritance) and property-transfer tax rates. Both are
    // genuinely set by each Brazilian state / Spanish autonomous community, so a
    // single country-wide number (the previous model) was always an approximation.
    // This file adds a REGION dimension on top of that: choosing a region changes
    // the DEFAULT rate the person sees, but it stays a plain editable number, same
    // as before, since these taxes have brackets, thresholds and family-specific
    // rules well beyond a flat rate — the region only makes the STARTING point closer
    // to reality. See getTaxRulesRegistry() (tax/effective-dates.js) for citations
    // and review dates.
    // =====================================================================

    // Brazil ITCMD: the ceiling ("herança", top bracket) rate published per state.
    // Source: itcmd.com.br/tabela-itcmd-2026, revised September 2026 — see each
    // state's own page there for the exact bracket structure (most states became
    // progressive under LC 227/2026; a few (ES, MS, MG, PR, RR, SP) still use one
    // flat rate). Showing the ceiling is a deliberately conservative simplification:
    // an estate usually pays LESS than this once run through the real brackets.
    const BR_ITCMD_BY_STATE = {
      AC: 7, AL: 8, AP: 6, AM: 4, BA: 8, CE: 8, DF: 6, ES: 4, GO: 8, MA: 7,
      MT: 8, MS: 6, MG: 5, PA: 6, PB: 8, PR: 4, PE: 8, PI: 6, RJ: 8, RN: 6,
      RS: 6, RO: 4, RR: 4, SC: 7, SP: 4, SE: 8, TO: 8
    };
    const BR_STATE_NAMES = {
      AC: 'Acre', AL: 'Alagoas', AP: 'Amapá', AM: 'Amazonas', BA: 'Bahia', CE: 'Ceará',
      DF: 'Distrito Federal', ES: 'Espírito Santo', GO: 'Goiás', MA: 'Maranhão', MT: 'Mato Grosso',
      MS: 'Mato Grosso do Sul', MG: 'Minas Gerais', PA: 'Pará', PB: 'Paraíba', PR: 'Paraná',
      PE: 'Pernambuco', PI: 'Piauí', RJ: 'Rio de Janeiro', RN: 'Rio Grande do Norte',
      RS: 'Rio Grande do Sul', RO: 'Rondônia', RR: 'Roraima', SC: 'Santa Catarina',
      SP: 'São Paulo', SE: 'Sergipe', TO: 'Tocantins'
    };

    // Spain ISD (Impuesto sobre Sucesiones y Donaciones): the estimate assumes the
    // household's own scenario — a SPOUSE OR CHILD inheriting (kinship Groups I/II) —
    // because that is who this app's own estate-planning numbers are for. Nearly every
    // autonomous community now applies a 95-100% rebate to that group, so the honest
    // starting point for most of Spain is close to 0%, not the old flat "1% for all of
    // Spain" default. A different heir (siblings, or no close relation) is taxed far
    // more heavily almost everywhere and is NOT what this default models — the rate
    // stays editable for that case.
    // Sources (accessed September 2026): ineaf.es, jmdominguez.es, guiafiscal.es
    // "Mapa de Sucesiones 2026", tribunalegal.es — cross-checked across independent
    // summaries; Cataluña and Castilla-La Mancha are consistently reported as the
    // exceptions with a real (if still modest) effective rate for this group.
    const ES_ISD_DIRECT_FAMILY_BY_REGION = {
      MD: 0.3, AN: 0.2, CN: 0.2, CB: 0.3, MC: 0.3, RI: 0.5, VC: 0.3, CL: 0.3,
      EX: 0.3, IB: 0.3, AR: 0.2, GA: 0.2, AS: 0.5, CM: 1.5, CT: 2.0, PV: 0.5, NC: 0.1
    };
    const ES_REGION_NAMES = {
      MD: 'Madrid', AN: 'Andalucía', CN: 'Canarias', CB: 'Cantabria', MC: 'Murcia',
      RI: 'La Rioja', VC: 'Comunidad Valenciana', CL: 'Castilla y León', EX: 'Extremadura',
      IB: 'Baleares', AR: 'Aragón', GA: 'Galicia', AS: 'Asturias', CM: 'Castilla-La Mancha',
      CT: 'Cataluña', PV: 'País Vasco', NC: 'Navarra'
    };

    // Spain ITP (Impuesto sobre Transmisiones Patrimoniales): the general rate on
    // buying a RESALE home, informational only in this app (shown as a reference
    // figure; not applied automatically to any Life Event or cash-flow number).
    // Only regions with a clear, single confirmed source are listed — the rest are
    // genuinely unconfirmed here rather than guessed (see taxRulesBadge('ES_ITP_REGIONAL')).
    // Sources (accessed September 2026): rankia.com, tribeus.es, guiareformas.es,
    // guiafiscal.es/patrimonio/itp/andalucia (Andalucía figure is the best-confirmed
    // of the set: a single unified 7% rate since the 2021 reform).
    const ES_ITP_BY_REGION = {
      MD: 6, NC: 6, PV: 4, AN: 7, CT: 10, VC: 9, GA: 10, CB: 9, CM: 9
    };

    function getRegionNames(country) {
      return country === 'BR' ? BR_STATE_NAMES : (country === 'ES' ? ES_REGION_NAMES : {});
    }

    // Extends the old flat-per-country default with a region, when the person picked one.
    function getDefaultSuccessionTaxRate(country, region) {
      if (country === 'BR' && region && BR_ITCMD_BY_STATE[region] !== undefined) return BR_ITCMD_BY_STATE[region];
      if (country === 'ES' && region && ES_ISD_DIRECT_FAMILY_BY_REGION[region] !== undefined) return ES_ISD_DIRECT_FAMILY_BY_REGION[region];
      if (country === 'GL') return 5; // generic placeholder: rules vary enormously by country
      if (country === 'ES') return 1;
      return 4; // BR, no region chosen
    }

    // null = no confirmed figure for this region (shown as "—", never a guess).
    function getRegionalItpRate(region) {
      return (region && ES_ITP_BY_REGION[region] !== undefined) ? ES_ITP_BY_REGION[region] : null;
    }

