var categoriesUrl =
  "https://records.byucougars.byu-dept-athletics-dev.amazon.byu.edu/api/categories";
var conferencesUrl =
  "https://records.byucougars.byu-dept-athletics-dev.amazon.byu.edu/api/conferences";
var statUrl =
  "https://records.byucougars.byu-dept-athletics-dev.amazon.byu.edu/api/stat";
var statsUrl =
  "https://records.byucougars.byu-dept-athletics-dev.amazon.byu.edu/api/stats";

// For UI to format dates
const months = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

// Vue trigger update button

new Vue({
  el: "#stats-vue",
  data: {
    message: "I am here",
    categories: [],
    conferences: [],
    stat: [],
    stats: [],
    allTime_stats: [],
    allTime_categories: [],
    statObject: {},
    type_options: [
      { text: "Team", value: "team" },
      { text: "Player", value: "individual" },
    ],
    time_options: [
      { text: "Career", value: "career" },
      { text: "Season", value: "season" },
      { text: "Game", value: "game" },
      { text: "Any Half", value: "half/0" },
      { text: "1st Half", value: "half/1" },
      { text: "2nd Half", value: "half/2" },
      { text: "Any Quarter", value: "qtr/0" },
      { text: "1st Quarter", value: "qtr/1" },
      { text: "2nd Quarter", value: "qtr/2" },
      { text: "3rd Quarter", value: "qtr/3" },
      { text: "4th Quarter", value: "qtr/4" },
      { text: "Overtime", value: "qtr/5" },
    ],
    category_options: [],
    statistic_options: [],
    selected: {
      type: undefined,
      time: undefined,
      category: undefined,
      statistic: undefined,
    },
    loading: false,
    table: {
      type_option: false,
      time_option_season: false,
      time_option_seasons: false,
      table_opponent: false,
      table_result: false,
      table_date: false,
      table_quarter: false,
      tabel_half: false,
    },
    rankStartPerPage: undefined,
    totalPages: undefined,
    currentPage: undefined,
    beforePage: undefined,
    afterPage: undefined,
  },
  mounted: function () {
    // ======= Getting Categorirs from URL API =======
    axios
      .get(categoriesUrl)
      .then(function (response) {
        this.categories = response.data;
        console.log(categories);
      })
      .catch(function (error) {
        console.log(error);
      });
    // ======= Getting Conferences from URL API =======
    axios
      .get(conferencesUrl)
      .then(function (response) {
        this.conferences = response.data;
      })
      .catch(function (error) {
        console.log(error);
      });
    // ======= Getting Stat from URL API =======
    axios
      .get(statUrl)
      .then(function (response) {
        this.stat = response.data;
      })
      .catch(function (error) {
        console.log(error);
      });
  },
  methods: {
    getCategories() {
      if (this.selected.type === "team") {
        this.category_options = categories.filter((c) => {
          if (c.teamStat !== false) return c;
        });
      } else if (this.selected.type === "individual") {
        this.category_options = categories.filter((c) => {
          if (c.teamStat !== true) return c;
        });
      } else {
        alert("Error Input on Type Box!");
      }
    },

    getStats() {
      // =================== time and category will trigger statistic ===================
      // statistic options = stat.common[category] + stat.season / stat.career[category]

      let type = this.selected.type;
      let time = this.selected.time;
      let category = this.selected.category;

      if (time && category) {
        var common_options = [];
        var time_options = [];

        // ====== First part: stat.common[category] ======
        if (stat.common[category]) {
          common_options = stat.common[category];
        }

        // ====== Second part: stat.season / stat.career[category] ======
        // season/career[category]: only happens when team->season and individual->career
        if (
          (type === "team" && time === "season") ||
          (type === "individual" && time === "career")
        ) {
          // stat only include common, season, and career, filter out stat.game/stat.anyHalf/stat.1sthalf/...(undefined)
          if (stat[time]) {
            // filter out when category option is not in stat, ex: info is not in career
            if (stat[time][category]) {
              time_options = stat[time][category];
            }
          }
        }

        this.statistic_options = common_options.concat(time_options);
      }
    },
    getTable() {
      let type = this.selected.type;
      let time = this.selected.time;
      let category = this.selected.category;
      let statistic = this.selected.statistic;

      if (type && time && category && statistic) {
        this.loading = true;

        if (!this.currentPage) {
          this.currentPage = 1;
          this.changePage(this.currentPage);
        }

        // ===== Getting stats table based on selections =====
        axios
          .post(statsUrl, {
            page: this.currentPage,
            team: type,
            time: time,
            category: category,
            stat: statistic,
          })
          .then((response) => {
            // axios must use arrow function
            // data length
            data_count = response.data.count;
            console.log(data_count);

            this.rankStartPerPage = (this.currentPage - 1) * 50 + 1;
            this.beforePage = this.currentPage - 1;
            this.afterPage = this.currentPage + 1;
            this.totalPages = Math.ceil(parseInt(data_count) / 50);

            this.stats = response.data.data;
            this.table["type_option"] = type === "individual";
            this.table["time_option_season"] = time === "season";
            this.table["time_option_seasons"] =
              type === "individual" && time === "career";
            this.table["table_opponent"] = this.timeGame();
            this.table["table_result"] = this.timeGame();
            this.table["table_date"] = this.timeGame();
            this.table["table_quarter"] = this.timeCompare("qtr");
            this.table["tabel_half"] = this.timeCompare("half");
          });

        // ===== Getting all time stats table =====
        axios
          .post(statsUrl, {
            page: 1,
            team: type,
            time: "allTime",
            category: category,
            stat: statistic,
          })
          .then((response) => {
            // axios must use arrow function
            this.allTime_stats = response.data.data;
            this.allTime_categories = categories;
            if (this.statObject) {
              // console.log(Object.keys(this.statObject));
              urlKeys = Object.keys(this.statObject);
              urlKeys.forEach((key) => {
                // console.log('----------key--------',key);
                this.statObject[key].forEach((object) => {
                  // console.log(object.URL);
                  if (this.allTime_stats[0][key]) {
                    object["value"] = this.allTime_stats[0][key][object.URL];
                  }
                });
              });
              // console.log('this.statObject',this.statObject);
            }
          });
      }
    },
    // Used in the UI to determine if the time passed matches the searchValues
    timeCompare(value) {
      // return value === $scope.searchValues['time'] || $scope.searchValues["time"].includes(value);
      return this.selected.time.includes(value);
    },
    // To check if a given time is part of a game (game, quarter, or half)
    timeGame() {
      return (
        this.selected.time === "game" ||
        this.selected.time.includes("half") ||
        this.selected.time.includes("qtr")
      );
    },

    formDateStr(str) {
      var date = new Date(str);
      var dateStr =
        months[date.getMonth()] +
        " " +
        date.getDate() +
        ", " +
        date.getFullYear();
      return dateStr;
    },

    containsObject(list, obj) {
      var i;
      for (i = 0; i < list.length; i++) {
        if (list[i].Name === obj.Name) {
          return !true;
        }
      }
      return !false;
    },
    // used for displaying all time team stats in the UI
    statUI() {
      for (var key in stat) {
        for (var statKey in stat[key]) {
          if (!this.statObject[statKey]) {
            this.statObject[statKey] = [];
          }
          array = this.statObject[statKey];
          stat[key][statKey].forEach((statValue, index) => {
            if (this.containsObject(array, statValue)) {
              array.push(statValue);
            }
          });
        }
      }
    },
    changePage(selectedPage) {
      this.currentPage = selectedPage;
      this.beforePage = selectedPage - 1;
      this.afterPage = selectedPage + 1;
      this.getTable();
      console.log(this.currentPage);
    },
    myTouchStartHandler() {
      console.log("Moved");
      // let p = e.touches[0];
      // let el = document.elementFromPoint(p.clientX, p.clientY);
      // let cmp = this.$children.find(c => c.$el === el);
      // if (cmp) {
      //   cmp.setActive()
      // }
    },
  },
});

document
  // .querySelector(".sidebar .toggle-btn")
  .querySelector(".toggle-btn")
  .addEventListener("click", function () {
    document.querySelector(".sidebar").classList.toggle("active");
    // document.querySelector(".expand_arrow").classList.toggle("active");
  });

$("body").mouseup(function () {
  $(".sidebar").removeClass("active");
  $(".expand_arrow").removeClass("active");
});

$("#stats-vue").bind("touchmove", function (e) {
  // e.preventDefault();
  $(".sidebar").removeClass("active");
  $(".expand_arrow").removeClass("active");
});

// function openNav() {
//   // document.getElementById("mySidebar").style.width = "450px";
//   document.getElementById("stats-vue").style.marginRight = "450px";
// }

// function closeNav() {
//   // document.getElementById("mySidebar").style.width = "0";
//   document.getElementById("stats-vue").style.marginRight = "0";
// }
