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
  "Jan.", // "January",
  "Feb.", // "February",
  "Mar.",  // "March",
  "Apr.",  // "April",
  "May",  //"May",
  "Jun.", // "June",
  "Jul.", // "July",
  "Aug.", // "August",
  "Sep.",  // "September",
  "Oct.",  // "October",
  "Nov.", // "November",
  "Dec.", // "December",
];

// Vue trigger update button

new Vue({
  el: "#stats-vue",
  data: {
    message: "I am here",
    categories: [],
    conferences: [],
    opponents:[],
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
      type: undefined, // undefined for no input
      time: undefined,
      category: undefined,
      statistic: undefined,
      conference: undefined,
      opponent: undefined,
      location: undefined,
      ranked: undefined,
      timeSpan:"year",
      date1: undefined,
      date2: undefined,
      year1: undefined,
      year2: undefined,
    },
    loading: false,
    advanceFilter: false,
    table: {
      type_option: false, // false or true for showing v-if or not 
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
  mounted: async function () {
    // ======= Getting Categorirs from URL API =======
    axios
      .get(categoriesUrl)
      .then(function (response) {
        this.categories = response.data;
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

    // ======= fetch Conferences from URL API =======
    const res = await fetch(conferencesUrl);
    const data = await res.json();
    this.conferences = data;
  },
  methods: {
    cleanTimeSpan(){
      if (this.selected.timeSpan === 'year') {
        this.selected.date1 = "";
        this.selected.date2 = "";
      } else if (this.selected.timeSpan === 'date') {
        this.selected.year1 = "";
        this.selected.year2 = "";
      }

    },
    getOppoent(){
      this.opponents = this.conferences.filter(c => c.name === this.selected.conference)[0].teams;
    },
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
    advanceFilterButtonToggle(){
      this.advanceFilter = !this.advanceFilter;
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
    emptyOldStatOption(){
      this.selected.statistic = undefined;
      this.loading = false;
    },
    clearAdvancedOptions(){
      this.selected.conference = undefined;
      this.selected.location = undefined;
      this.selected.opponent = undefined;
      this.selected.ranked = undefined;
      this.selected.date1 = undefined;
      this.selected.date2 = undefined;
      this.selected.year1 = undefined;
      this.selected.year2 = undefined;
      this.getTable();
    },
    getTable() {
      let type = this.selected.type;
      let time = this.selected.time;
      let category = this.selected.category;
      let statistic = this.selected.statistic;

      let conference = this.selected.conference;
      let location = this.selected.location;
      let opponent = this.selected.opponent;
      let ranked = this.selected.ranked;
      let date1 = this.selected.date1;
      let date2 = this.selected.date2;
      let year1 = this.selected.year1;
      let year2 = this.selected.year2;

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
            conference: conference,
            location: location, 
            opponent: opponent, 
            ranked: ranked,
            year1:year1,
            year2:year2,
            date1:date1,
            date2:date2,
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
      }
    },
    getAllStatsTable(){
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

        // ===== Getting all time stats table =====
        axios
          .post(statsUrl, {
            page: 1,
            team: "team",
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
                this.statObject[key].forEach((object) => {
                  // console.log(object.URL);
                  if (this.allTime_stats[0][key]) {
                    object["value"] = this.allTime_stats[0][key][object.URL];
                  }
                });
              });
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
    },
    playUrlTrim(nid, opponent){
      // 1. get correct respone, but 
      // https://byucougars.com/game/football/1295638/south-florida#eventstats
      // 2. redirect to alternative page when response is wrong
      // https://byucougars.com/node/78097
      
      var title = opponent.replaceAll(/[^\w\s]/gi, '').replaceAll(" ", "-").toLowerCase()
      // url = `https://byucougars.com/game/football/${nid}/${title}#eventstats`
      url = `https://byucougars.com/node/${nid}`;
      return url
    },
  },
});

document
  // .querySelector(".sidebar .toggle-btn")
  .querySelector(".toggle-btn")
  .addEventListener("click", function () {
    document.querySelector(".sidebar").classList.toggle("active");
    document.querySelector(".stats-toggle-icon").classList.toggle("active");
  });

// icon info hover for computer
// $(".stats-toggle-icon").hover(
//   function () {
//     $(".icon-info").css("opacity", "1");
//     $(".icon-info").css("right", "70px");
//   },
//   function () {
//     $(".icon-info").css("opacity", "0");
//     $(".icon-info").css("right", "0px");
//   }
// );

// icon info hover for mobile
$(".stats-toggle-icon").click(function () {
  $(".icon-info").css("opacity", "0");
  $(".icon-info").css("right", "0px");
});
