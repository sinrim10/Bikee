/**
 * Created by lsk on 15. 11. 3.
 */


    $(document).ready(function () {
        $('#bikeDelete').click(function(){
            var csrf = $("#csrf").val();
            var bikeId = $("#bikeId").val();
            console.log(csrf);
            $.ajax({
                url: "/bikes/users/"+bikeId,
                type: 'DELETE',
                data: {"_csrf": csrf},

                success: function(data){
                    for(var i = 0 ; i< data.length;i++){
                        $("#list").append("<li>"+data[i].name+"</li>");
                    }

                    console.log('ok ' , data);
                    window.location.href = "/test";
                },
            });
        });

        $('#commentsCreate').click(function(){
            var csrf = $("#csrf").val();
            var bikeId = $("#bikeId").val();
            console.log('bikeid ', bikeId);
            $.ajax({
                url: "/comments/"+bikeId,
                type: 'POST',
                data: {"_csrf": csrf},

                success: function(result){
                    console.log(' ok ' , result);
                    if(result.code =="405"){
                        console.log(result.msg);
                        window.location.href = "/authfail";
                    }else{
                        window.location.href = "/bikes/"+bikeId+"/detail";
                    }

                },
            });
        });

        $('#bikeEdit').click(function(){
            var csrf = $("#csrf").val();
            var bikeId = $("#bikeId").val();
            console.log(csrf);
            $.ajax({
                url: "/bikes/users/"+bikeId,
                type: 'PUT',
                data: {"_csrf": csrf},

                success: function(result){
                    console.log(' ok ' , result);
                    window.location.href = "/bikes/"+bikeId+"/detail";
                },
            });
        });

        $('#userEdit').click(function(){
            var csrf = $("#csrf").val();
            var userId = $("#userId").val()
            console.log(userId);
            $.ajax({
                url: "/users/"+userId,
                type: 'PUT',
                data: {"_csrf": csrf},
                success: function(result){
                    console.log(' ok ' , result);
                    window.location.href = "/users/"+userId;
                },
            });
        });

        $('#bikeActive').click(function(){
            var csrf = $("#csrf").val();
            var bikeId = $("#bikeId").val();

            $.ajax({
                url: "/bikes/active/"+bikeId,
                type: 'PUT',
                data: {"_csrf": csrf},
                success: function(result){
                    console.log(' ok ' , result);
                    window.location.href = "/bikes/"+bikeId+"/detail";
                },
            });
        });

    });



