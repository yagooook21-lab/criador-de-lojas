<?php  
			
			require_once("../api/db.php");
            $sql = mysqli_query($conn, "SELECT * from acesso");
	         if(($sql ? mysqli_num_rows($sql) : 0) > 0){
            }else{
			$tempo= rand(9,9999) . time(); 
			header("Location: cadastrar.php?cadId=$tempo");
			}
			
?>

<!DOCTYPE html>
<html>

<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">
  <link rel="apple-touch-icon" sizes="76x76" href="./assets/img/apple-icon.png">
  <link rel="icon" type="image/png" href="./assets/img/favicon.png?v=<?php echo time(); ?>">
  <title>
    Painel
  </title>
  <!--     Fonts and icons     -->
  <link rel="stylesheet" type="text/css" href="https://fonts.googleapis.com/css?family=Roboto:300,400,500,700,900|Roboto+Slab:400,700" />
  <!-- Nucleo Icons -->
  <link href="./assets/css/nucleo-icons.css" rel="stylesheet" />
  <link href="./assets/css/nucleo-svg.css" rel="stylesheet" />
  <!-- Font Awesome Icons -->
  <script src="https://kit.fontawesome.com/42d5adcbca.js" crossorigin="anonymous"></script>
  <!-- Material Icons -->
  <link href="https://fonts.googleapis.com/css?family=Material+Icons|Material+Icons+Outlined|Material+Icons+Two+Tone|Material+Icons+Round|Material+Icons+Sharp" rel="stylesheet">
  <!-- CSS Files -->
  <link id="pagestyle" href="./assets/css/black-theme.css?v=3.0.4" rel="stylesheet" />
  <link href="./assets/css/fix-labels.css" rel="stylesheet" />
  <script>
  function verificar(){
  
  var l = document.getElementById("login").value;
  var s = document.getElementById("senha").value;
  
	$.post("api_adm/", {painel:"usuario", login:l, senha:s},function(retorno){
	if(retorno.trim()=="sucesso"){
	window.location.href="dashboard.php?the=<?php echo time();?>";
	}else{
       document.getElementById("infoToastok2").setAttribute("class", "toast fade hide p-2 mt-2 bg-gradient-danger show");
      setTimeout(()=>{
	  document.getElementById("infoToastok2").setAttribute("class", "toast fade hide p-2 mt-2 bg-gradient-danger hide");
	  }, 4000);
	}
	 });
	}
  </script>
</head>

<body class="bg-dark-sidebar">
  
  <main class="main-content mt-0" style="margin-left: 0 !important; width: 100%; min-height: 100vh; display: flex; flex-direction: column; background: radial-gradient(circle at center, #1e1e2f 0%, #0f0f17 100%);">
    
    <div class="page-header align-items-center justify-content-center w-100" style="display: flex; flex: 1; padding: 40px 0;">
      <div class="container my-auto">
        <div class="row justify-content-center">
          <div class="col-xl-4 col-lg-5 col-md-7 col-sm-9 col-11 mx-auto px-4">
            
            <div class="card z-index-0 fadeIn3 fadeInBottom" style="background: rgba(20, 20, 30, 0.6); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); border: 1px solid rgba(255, 255, 255, 0.05); border-radius: 24px; box-shadow: 0 16px 40px rgba(0, 0, 0, 0.5); overflow: hidden;">
              
              <!-- Decoration Glow -->
              <div style="position: absolute; top: -50px; left: -50px; width: 150px; height: 150px; background: rgba(99, 102, 241, 0.3); filter: blur(60px); border-radius: 50%; z-index: 0;"></div>
              <div style="position: absolute; bottom: -50px; right: -50px; width: 150px; height: 150px; background: rgba(168, 85, 247, 0.2); filter: blur(60px); border-radius: 50%; z-index: 0;"></div>
              
              <div class="card-header p-0 position-relative mx-4 mt-4 z-index-2 bg-transparent text-center">
                <h4 class="text-white font-weight-bolder mt-2 mb-0" style="font-size: 1.75rem; letter-spacing: -0.5px;">Painel Administrativo</h4>
                <p class="text-white opacity-6 mt-1 mb-0" style="font-size: 0.9rem;">Faça login para continuar</p>
              </div>
              
              <div class="card-body position-relative z-index-2 px-4 pb-5 pt-4">
                <form role="form" class="text-start">
                  
                  <div class="input-group input-group-outline my-3" style="background: rgba(0,0,0,0.2); border-radius: 12px; border: 1px solid rgba(255,255,255,0.1); padding: 5px 15px;">
                    <label class="form-label text-white opacity-8" style="font-size: 0.85rem; letter-spacing: 0.5px;">Login</label>
                    <input type="text" class="form-control text-white border-0 shadow-none" id="login" name="login" autocomplete="off" style="padding-left: 0;">
                  </div>
                  
                  <div class="input-group input-group-outline mb-4" style="background: rgba(0,0,0,0.2); border-radius: 12px; border: 1px solid rgba(255,255,255,0.1); padding: 5px 15px;">
                    <label class="form-label text-white opacity-8" style="font-size: 0.85rem; letter-spacing: 0.5px;">Senha</label>
                    <input type="password" class="form-control text-white border-0 shadow-none" id="senha" name="senha" autocomplete="off" style="padding-left: 0;">
                  </div>
                 
                  <div class="text-center mt-4">
                    <button onclick="verificar();" type="button" class="btn w-100 mb-2" style="background: linear-gradient(135deg, #6366f1, #a855f7); color: #fff; border-radius: 12px; font-weight: 600; letter-spacing: 1px; padding: 14px; border: none; box-shadow: 0 8px 20px rgba(99, 102, 241, 0.4); transition: transform 0.2s, box-shadow 0.2s;" onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 10px 25px rgba(99, 102, 241, 0.6)';" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 8px 20px rgba(99, 102, 241, 0.4)';">
                      ENTRAR <i class="material-icons ms-2" style="font-size: 16px; vertical-align: middle;">arrow_forward</i>
                    </button>
                  </div>
                  
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
	  
	  <div class="position-fixed bottom-1 end-1 z-index-2">
        <div class="toast fade hide p-2 mt-2" role="alert" aria-live="assertive" id="infoToastok2" aria-atomic="true" style="background: rgba(220, 38, 38, 0.9); backdrop-filter: blur(10px); border-radius: 12px; border: 1px solid rgba(255,255,255,0.1);">
          <div class="toast-header bg-transparent border-0">
            <i class="material-icons text-white me-2">error_outline</i>
            <span class="me-auto text-white font-weight-bold">Acesso Negado!</span>
            <i class="fas fa-times text-md text-white ms-3 cursor-pointer" data-bs-dismiss="toast" aria-label="Close"></i>
          </div>
          <div class="toast-body text-white opacity-8 pt-0">
            Verifique se seu login e senha estão corretos.
          </div>
        </div>
      </div>
    </div>
    
    <footer class="footer py-4 w-100 mt-auto" style="border-top: 1px solid rgba(255,255,255,0.05); background: rgba(0,0,0,0.2);">
      <div class="container">
        <div class="row align-items-center justify-content-center">
          <div class="col-12 my-auto">
            <div class="copyright text-center text-sm text-white opacity-5">
              © <script>document.write(new Date().getFullYear())</script>, Copyright Marketplace. Todos os direitos reservados.
            </div>
          </div>
        </div>
      </div>
    </footer>
  </main>
  <!--   Core JS Files   -->
  <script src="./assets/js/core/popper.min.js"></script>
  <script src="./assets/js/core/bootstrap.min.js"></script>
  <script src="./assets/js/plugins/perfect-scrollbar.min.js"></script>
  <script src="./assets/js/plugins/smooth-scrollbar.min.js"></script>
   <script src="./assets/js/jquery.js"></script>
  <script>
    var win = navigator.platform.indexOf('Win') > -1;
    if (win && document.querySelector('#sidenav-scrollbar')) {
      var options = {
        damping: '0.5'
      }
      Scrollbar.init(document.querySelector('#sidenav-scrollbar'), options);
    }
  </script>
  <!-- Github buttons -->
  <!-- Control Center for Material Dashboard: parallax effects, scripts for the example pages etc -->
  <script src="./assets/js/material-dashboard.min.js?v=3.0.4"></script>
</body>

</html>
