function populate_table(datasets) { // Main filterable table
  var tableRef = document.getElementById('datasets').getElementsByTagName('tbody')[0];
  datasets.forEach(result => {
    newRow = tableRef.insertRow();

    // Note that trying to embed html closing tags here breaks when shown in Vortex
    var tdTitle = document.createElement('td');
    var anch = Object.assign(document.createElement('a'), {href: "https://gbif.org/dataset/" + result['key'], textContent: result['title']});
    tdTitle.appendChild(anch);
    newRow.appendChild(tdTitle);
    newRow.appendChild(Object.assign(document.createElement('td'), {textContent: result['publishingOrganizationTitle']}));
    newRow.appendChild(Object.assign(document.createElement('td'),{id:result['key'], className:'table-number', textContent:parseInt(result['recordCount']).toLocaleString('en-GB')}));
    newRow.appendChild(Object.assign(document.createElement('td'), {textContent: result['type']}));
    newRow.appendChild(Object.assign(document.createElement('td'), {textContent: result['hostingOrganizationTitle']}));
  });
}

var getOtherDatasetCounts = async(datasets) => {
    for(var res of datasets) {
        if('recordCount' in res && res['type'] != 'CHECKLIST') { continue; }
        var count = 0;
        if(res['type'] == 'OCCURRENCE' || res['type'] == 'SAMPLING_EVENT') {
            const d_response = await fetch('https://api.gbif.org/v1/occurrence/count?datasetKey=' + res['key'])
            count = await d_response.json();
        } else if(res['type'] == 'CHECKLIST') {
            const d_response = await fetch('https://api.gbif.org/v1/dataset/' + res['key'] + '/metrics')
            var response = await d_response.json();
            count = response['countByOrigin']['SOURCE'];
        }
        var cellRef = document.getElementById(res['key']);
        cellRef.innerHTML = parseInt(count).toLocaleString('en-GB');
        res['recordCount'] = count;
    }
}

const pageLoad = async () => {
    try {
        const ds_response = await fetch('https://api.gbif.org/v1/dataset/search?publishingCountry=NO&limit=500');
        var dataset_results = await ds_response.json();
        datasets = dataset_results['results'];
    } catch(err) {
        datasets = cache;
    }
    await populate_table(datasets);

    var tf = new TableFilter(document.getElementById("datasets"), {
      base_path: "https://unpkg.com/tablefilter@0.6.109/dist/tablefilter/",
      alternate_rows: true,
      col_types: ['string', 'string', 'number', 'string', 'string', 'date', 'date'],
      col_1: 'select',
      col_2: 'none',
      col_3: 'select',
      col_4: 'select',
      col_5: 'none',
      col_6: 'none',
      clear_filter_text: '- All -',
      extensions: [{ name: 'sort' }]
    });
    tf.init();

    await getOtherDatasetCounts(datasets);

    // Pivot
    $("#pivot").pivotUI(datasets, {
      rows: ['publishingOrganizationTitle'],
      cols: [''],
      aggregatorName: "Integer Sum",
      vals: ["recordCount"]
    });

    // Have to reinitialise the table so sort by count is correct
    tf.init();
}
pageLoad();

$('#pivotButton').click(function() {
    $('#pivot').show();
    $('#datasets').hide();
    $('#pivotButton').addClass('active');
    $('#overviewButton').removeClass('active');
});
$('#overviewButton').click(function() {
    $('#pivot').hide();
    $('#datasets').show();
    $('#pivotButton').removeClass('active');
    $('#overviewButton').addClass('active');
});
