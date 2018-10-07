var bg = chrome.extension.getBackgroundPage();

(function() {
  var StatisticView = BH.Views.MainView.extend({
    className: 'statistic_view',
    template: 'statistic.html',
    events: {
      'click #today': 'clickedToday',
      'click #yesterday': 'clickedYesterday',
      'click #thisweek': 'clickedThisweek',
      'click #prevweek': 'clickedPrevweek',
      'click #average': 'clickedAverage',
      'click #all': 'clickedAll'
    },
    render: function() {
      var presenter = new BH.Presenters.StatisticPresenter();
      var properties = _.extend(this.getI18nValues());
      var template = BH.Lib.Template.fetch(this.template);
      var html = Mustache.to_html(template, properties);
      this.$el.append(html);

      // Load the Visualization API and the piechart package.
      google.load('visualization', '1.0', {packages:['corechart', 'table'],callback:function(){
          if (top === self) {
	    show(bg.TYPE.today);
          } else {
	      if (bg.mode === bg.TYPE.today) {
	        show(bg.TYPE.today);
	      } else if (bg.mode === bg.TYPE.yesterday) {
	        show(bg.TYPE.yesterday);
	      } else if (bg.mode === bg.TYPE.thisweek) {
	        show(bg.TYPE.thisweek);
	      } else if (bg.mode === bg.TYPE.prevweek) {
	        show(bg.TYPE.prevweek);
	      } else if (bg.mode === bg.TYPE.average) {
	        show(bg.TYPE.average);
	      } else if (bg.mode === bg.TYPE.all) {
	        show(bg.TYPE.all);
	      } else {
	        console.error("No such type: " + bg.mode);
	      }
          }
	}});
      return this;
    },

    clickedToday: function(ev) {
			ev.preventDefault();
			show(bg.TYPE.today);
    },

    clickedYesterday: function(ev) {
			ev.preventDefault();
			show(bg.TYPE.yesterday);
    },

    clickedThisweek: function(ev) {
			ev.preventDefault();
			show(bg.TYPE.thisweek);
    },

    clickedPrevweek: function(ev) {
			ev.preventDefault();
			show(bg.TYPE.prevweek);
    },

    clickedAverage: function(ev) {
			ev.preventDefault();
			show(bg.TYPE.average);
    },

    clickedAll: function(ev) {
			ev.preventDefault();
			show(bg.TYPE.all);
    },

    getI18nValues: function() {
      return BH.Chrome.I18n.t([
        'search_input_placeholder_text',
        'no_visits_found'
      ]);
    }
  });

  BH.Views.StatisticView = StatisticView;


	// Converts duration to String
	function timeString(numSeconds) {
	  if (numSeconds === 0) {
	    return "0 seconds";
	  }
	  var remainder = numSeconds;
	  var timeStr = "";
	  var timeTerms = {
	    hour: 3600,
	    minute: 60,
	    second: 1
	  };
	  // Don't show seconds if time is more than one hour
	  if (remainder >= timeTerms.hour) {
	    remainder = remainder - (remainder % timeTerms.minute);
	    delete timeTerms.second;
	  }
	  // Construct the time string
	  for (var term in timeTerms) {
	    var divisor = timeTerms[term];
	    if (remainder >= divisor) {
	      var numUnits = Math.floor(remainder / divisor);
	      timeStr += numUnits + " " + term;
	      // Make it plural
	      if (numUnits > 1) {
	        timeStr += "s";
	      }
	      remainder = remainder % divisor;
	      if (remainder) {
	        timeStr += " and ";
	      }
	    }
	  }
	  return timeStr;
	}

	// Show the data for the time period indicated by addon
	function displayData(type) {
	  // Get the domain data
	  var domains = JSON.parse(localStorage["domains"]);
	  var chart_data = [];
	  for (var domain in domains) {
	    var domain_data = JSON.parse(localStorage[domain]);
	    var numSeconds = 0;
	    if (type === bg.TYPE.today) {
	      numSeconds = domain_data.today;
	    } else if (type === bg.TYPE.yesterday) {
	    	numSeconds = domain_data.yesterday;
	    } else if (type === bg.TYPE.thisweek) {
	    	numSeconds = domain_data.thisweek;
	    } else if (type === bg.TYPE.prevweek) {
	    	numSeconds = domain_data.prevweek;
	    } else if (type === bg.TYPE.average) {
	      numSeconds = Math.floor(domain_data.all / parseInt(localStorage["num_days"], 10));
	    } else if (type === bg.TYPE.all) {
	      numSeconds = domain_data.all;
	    } else {
	      console.error("No such type: " + type);
	    }
	    if (numSeconds > 0) {
	      chart_data.push([domain, {
	        v: numSeconds,
	        f: timeString(numSeconds),
	        p: {
	          style: "text-align: left; white-space: normal;"
	        }
	      }]);
	    }
	  }

	  // Display help message if no data
	  if (chart_data.length === 0) {
	    document.getElementById("nodata").style.display = "inline";
	  } else {
	    document.getElementById("nodata").style.display = "none";
	  }

	  // Sort data by descending duration
	  chart_data.sort(function (a, b) {
	    return b[1].v - a[1].v;
	  });

	  // Limit chart data
	  var limited_data = [];
	  var chart_limit;
	  // For screenshot: if in iframe, image should always have 9 items
	  if (top == self) {
	    chart_limit = parseInt(localStorage["chart_limit"], 10);
	  } else {
	    chart_limit = 9;
	  }
	  for (var i = 0; i < chart_limit && i < chart_data.length; i++) {
	    limited_data.push(chart_data[i]);
	  }
	  var sum = 0;
	  for (var i = chart_limit; i < chart_data.length; i++) {
	    sum += chart_data[i][1].v;
	  }
	  // Add time in "other" category for total and average
	  var other = JSON.parse(localStorage["other"]);
	  if (type === bg.TYPE.average) {
	    sum += Math.floor(other.all / parseInt(localStorage["num_days"], 10));
	  } else if (type === bg.TYPE.all) {
	    sum += other.all;
	  }
	  if (sum > 0) {
	    limited_data.push(["Other", {
	      v: sum,
	      f: timeString(sum),
	      p: {
	        style: "text-align: left; white-space: normal;"
	      }
	    }]);
	  }

	  // Draw the chart
	  drawChart(limited_data);

	  // Add total time
	  var total = JSON.parse(localStorage["total"]);
	  var numSeconds = 0;
	  if (type === bg.TYPE.today) {
	    numSeconds = total.today;
	  } else if (type === bg.TYPE.yesterday) {
	    numSeconds = total.yesterday;
	  } else if (type === bg.TYPE.thisweek) {
	    numSeconds = total.thisweek;
	  } else if (type === bg.TYPE.prevweek) {
	    numSeconds = total.prevweek;
	  } else if (type === bg.TYPE.average) {
	    numSeconds = Math.floor(total.all / parseInt(localStorage["num_days"], 10));
	  } else if (type === bg.TYPE.all) {
	    numSeconds = total.all;
	  } else {
	    console.error("No such type: " + type);
	  }
	  limited_data.push([{
	    v: "Total",
	    p: {
	      style: "font-weight: bold;"
	    }
	  }, {
	    v: numSeconds,
	    f: timeString(numSeconds),
	    p: {
	      style: "text-align: left; white-space: normal; font-weight: bold;"
	    }
	  }]);

	  // Draw the table
	  drawTable(limited_data, type);
	}

	function updateNav(type) {
	  document.getElementById('today').className = '';
	  document.getElementById('yesterday').className = '';
	  document.getElementById('thisweek').className = '';
	  document.getElementById('prevweek').className = '';
	  document.getElementById('average').className = '';
	  document.getElementById('all').className = '';
	  document.getElementById(type).className = 'active';
	}

	function show (mode) {
	  bg.mode = mode;
	  displayData(mode);
	  updateNav(mode);
	}

	// Callback that creates and populates a data table,
	// instantiates the pie chart, passes in the data and
	// draws it.
	function drawChart(chart_data) {
          if (!google || !google.visualization)
            return;

	  // Create the data table.
	  var data = new google.visualization.DataTable();
	  data.addColumn('string', 'Domain');
	  data.addColumn('number', 'Time');
	  data.addRows(chart_data);

	  // Set chart options
	  var options = {
	    tooltip: {
				text: 'both',
				isHtml: true,
	    },
	    chartArea: {
	      width: 400,
	      height: 180,
	    },
	    is3D: true,
	  };

	  // Instantiate and draw our chart, passing in some options.
	  var chart = new google.visualization.PieChart(document.getElementById('chart_div'));
	  chart.draw(data, options);
	}

	function drawTable(table_data, type) {
		var bg = chrome.extension.getbgPage();
          if (!google || !google.visualization)
            return;
	  var data = new google.visualization.DataTable();
	  data.addColumn('string', 'Domain');
	  var timeDesc;
	  if (type === bg.TYPE.today) {
	    timeDesc = "Today";
	  } else if (type === bg.TYPE.yesterday) {
	    timeDesc = "Yesterday";
	  } else if (type === bg.TYPE.thisweek) {
	    timeDesc = "This Week";
	  } else if (type === bg.TYPE.prevweek) {
	    timeDesc = "Previous Week";
	  } else if (type === bg.TYPE.average) {
	    timeDesc = "Daily Average";
	  } else if (type === bg.TYPE.all) {
	    timeDesc = "Over " + localStorage["num_days"] + " Days";
	  } else {
	    console.error("No such type: " + type);
	  }
	  data.addColumn('number', "Time Spent (" + timeDesc + ")");
	  data.addRows(table_data);

	  var options = {
	    allowHtml: true,
	    sort: 'disable'
	  };
	  var table = new google.visualization.Table(document.getElementById('table_div'));
	  table.draw(data, options);
	}

})();
