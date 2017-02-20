app.route('/app/:app_id', 'appswitch', function (app_id) {
    if(countlyGlobal["apps"][app_id]){
        countlyCommon.setActiveApp(app_id);
        var sidebarApp = $("#sidebar-app-select");
        sidebarApp.find(".text").text(countlyGlobal["apps"][app_id].name);
        sidebarApp.find(".logo").css("background-image", "url('"+countlyGlobal["path"]+"appimages/"+app_id+".png')");
        sidebarApp.removeClass("active");
        app.onAppSwitch(app_id);
        app.activeView.appChanged();
    }
    app.navigate("/", true);
});