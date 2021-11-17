const App = (props) => {
    const [isLogged, setIsLogged] = useState();
    const [initialAction, setInitialAction] = useState();
  
    useEffect(() => {
      if (read_cookie("tokenServer").length > 0) {
        setIsLogged(true);
      } else {
        setIsLogged(false);
      }
    }, []);
  
    const validateLogin = (tokenServer) => {
      if (tokenServer.length > 0) {
        setIsLogged(true);
      } else {
        setIsLogged(false);
      }
    };
  
    const initialAction = (action) => {
      if (action) {
        setInitialAction(action);
      }
    };
  
    const logOut = () => {
      window.history.replaceState("", "", "/");
      window.location.reload();
    };
  
    // Checks for autologin
    const urlWindow = window.location;
  
    if (urlWindow.pathname.split("/")[1] === "autologin") {
      const tok = urlWindow.pathname.split("/")[2];
      bake_cookie("tokenServer", tok);
      window.history.replaceState("", "", "/jobs");
      window.location.reload();
    }
  
    if (urlWindow.pathname.split("/")[1] === "reset_password") {
      const urlParams = new URLSearchParams(window.location.search);
      const token = urlParams.get("token");
      return <PasswordReset token={token} />;
    }
  
    if (urlWindow.pathname.split("/")[1] === "ej_test") {
      const urlParams = new URLSearchParams(window.location.search);
      const token = urlParams.get("token");
      return <EjTest token={token} />;
    }
  
    if (
      urlWindow.pathname.split("/")[1] === "job" &&
      urlWindow.pathname.split("/")[2] === "skills_evaluation"
    ) {
      const urlParams = new URLSearchParams(window.location.search);
      const token = urlParams.get("token");
      return <EvaluateTalentSkills token={token} />;
    }
  
    if (isLogged && util.user.role !== 2) {
      return <MainSection logOut={logOut} isLogged={isLogged} />;
    }
  
    return (
      <Switch>
        <Route exact path="/">
          <Redirect to={"/careers"} />
        </Route>
        {/*<Route exact path="/"><Redirect to={"/talent/profile"}/></Route>*/}
        <Route exact path={`/profile/${util.user.candidate_id}`}>
          <MainSection logOut={logOut} isLogged={isLogged} />
        </Route>
        <Route exact path="/careers" component={Positions} />
        {/*<Route exact path="/careers/job/:id" component={JobDetail}/>*/}
        <Route exact path="/auth">
          <Login checkIfLogged={validateLogin} />
        </Route>
        {/* If nothing match, will redirect to careers*/}
        <Route exact path="/*">
          <Redirect to={"/careers"} />
        </Route>
      </Switch>
    );
  };
  
  export default App;
  