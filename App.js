class App extends Component {
  
    constructor( props ) {
        super( props );
        if ( read_cookie( 'tokenServer' ).length > 0 ) {
            this.state = {
                isLogged: true,
            };
        } else {
            this.state = {
                isLogged: false,
            };
        }
        this.validateLogin = this.validateLogin.bind( this );
        this.logOut = this.logOut.bind( this );
    }

  validateLogin = ( tokenServer ) => {
      if ( tokenServer.length > 0 ) {
          this.setState( {
              isLogged: true
          }, () => window.location.reload() );

      } else {
          this.setState( {
              isLogged: false
          } );
      }

  }

  initialAction = ( action ) => {
      if ( action ) {
          this.setState( {
              initialAction: action
          } );
      }
  }

  logOut = () => {
      window.history.replaceState( "", "", "/" );
      window.location.reload();
  }

  render() {
        console.log("Git check for the commit")
      // Checks for autologin
      const urlWindow = window.location;
    
      if ( urlWindow.pathname.split( "/" )[1] === "autologin" ) {
          const tok = urlWindow.pathname.split( "/" )[2];
          bake_cookie( "tokenServer", tok );
          window.history.replaceState( "", "", "/jobs" );
          window.location.reload();
      }

      if ( urlWindow.pathname.split( "/" )[1] === "reset_password" ) {
          const urlParams = new URLSearchParams( window.location.search );
          const token = urlParams.get( 'token' );
          return <PasswordReset token={token} />;
      }

      if ( urlWindow.pathname.split( "/" )[1] === "ej_test" ) {
          const urlParams = new URLSearchParams( window.location.search );
          const token = urlParams.get( 'token' );
          return <EjTest token={token} />;
      }

      if ( urlWindow.pathname.split( "/" )[1] === "job" && urlWindow.pathname.split( "/" )[2] === "skills_evaluation" ) {
          const urlParams = new URLSearchParams( window.location.search );
          const token = urlParams.get( 'token' );
          return <EvaluateTalentSkills token={token} />;
      }

      if ( this.state.isLogged && util.user.role !== 2 ) {
          return <MainSection logOut={this.logOut} isLogged={this.state.isLogged} />;
      }
    
      return(
          <Switch>
              <Route exact path="/"><Redirect to={"/careers"}/></Route>
              {/*<Route exact path="/"><Redirect to={"/talent/profile"}/></Route>*/}
              <Route exact path={`/profile/${util.user.candidate_id}`} >
                  <MainSection logOut={this.logOut} isLogged={this.state.isLogged} />
              </Route>
              <Route exact path="/careers" component={Positions}/>
              {/*<Route exact path="/careers/job/:id" component={JobDetail}/>*/}
              <Route exact path="/auth">
                  <Login checkIfLogged={this.validateLogin} />
              </Route>
              {/* If nothing match, will redirect to careers*/}
              <Route exact path="/*"><Redirect to={"/careers"}/></Route>
          
          </Switch>
      );

    
  }
}

export default App;
