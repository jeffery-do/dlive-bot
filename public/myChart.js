function renderChart(labs, dat) {
  var ctx = document.getElementById("myChart").getContext('2d');
  var myChart = new Chart(ctx, {
      type: 'bar',
    //   data: {
    //       labels: labs,
    //       data: dat,
    //   },
    //   data: {
    //       labels: ["a", "b", "c"],
    //       datasets:[{"label":"some label", "data":[1,2,3]}],
    //   }
      data: {
          labels: labs,
          datasets:[{ 
            "data":dat,
            "backgroundColor":[
                "rgba(230, 25, 75)", 
                "rgba(60, 180, 75)", 
                "rgba(255, 225, 25)", 
                "rgba(0, 130, 200)", 
                "rgba(245, 130, 48)", 
                "rgba(145, 30, 180)", 
                "rgba(70, 240, 240)", 
                "rgba(240, 50, 230)", 
                "rgba(210, 245, 60)", 
                "rgba(250, 190, 190)", 
                "rgba(0, 128, 128)", 
                "rgba(230, 190, 255)", 
                "rgba(170, 110, 40)", 
                "rgba(255, 250, 200)", 
                "rgba(128, 0, 0)", 
                "rgba(170, 255, 195)", 
                "rgba(128, 128, 0)", 
                "rgba(255, 215, 180)", 
                "rgba(0, 0, 128)", 
                "rgba(128, 128, 128)", 
                "rgba(255, 255, 255)", 
                "rgba(0, 0, 0)",
            ]
          }],

      },
      options:{
          animation: {
              duration: null
          },
          scales:{yAxes:[{ticks:{beginAtZero:true}}]}},
  });
}

function getChartData() {
    $.ajax({
        url: "http://localhost/chartdata",
        success: function (result) {
            result = JSON.parse(result)
            renderChart(result.labels, result.data);
        },
        error: function (err) {
        }
    });
}

function myCallback() {
    getChartData();
    console.log("refreshing chart");
}
setInterval(myCallback, 1000);