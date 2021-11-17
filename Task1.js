class NewRequirement extends Component {
    constructor( props ) {
        super( props );
        this.state = {
            hideModal: false,
            modalVisible: false,
            modalType: PARTNER,
            job: selector.job_position_base(),
            requirementID: null,
            catalog_job_desc: [],
            isLoading: true
        };
    }

    componentDidMount() {
        this.getCatalog().then( null );
    }

  getCatalog = async () => {
      // Make a request for catalog of job descriptions
      try {
          const { data } = await util
              .axios
              .get( `${util.url}/app_resources/job_descriptions` );
          if ( data.error ) throw data.msg;
          this.setState( { catalog_job_desc: data.job_descriptions, isLoading:false } );
      } catch ( error ) {
          util.handleError( error );
      }
  };

  selectAction = ( modalOption ) => {
      this.setState( {
          modalType: modalOption,
          modalVisible: true,
      } );
  };

  hideModal = () => {
      this.setState( {
          modalType: PARTNER,
          modalVisible: false,
      } );
  };

  handleChange = ( name, value ) => {
      let job = this.state.job;
      job[name] = value;
      this.setState( { job: job } );
  };

  selectedData = ( opc, data ) => {
      const job  = this.state.job;
      if ( opc === PARTNER ) {
          job.partner =  data;
      } else {
          job.client =  data;
      }
      this.setState( { job } );
  };

  saveJobOpening = () => {
      util
          .axios
          .post( `${util.baseUrl()}/jobs/new`, { job: this.state.job } )
          .then( ( response ) => {
              const { error, msg, requirement_id } = response.data;
              if ( error ) return util.toast().error( msg );
              util.toast().success( msg );
              this.setState( {
                  requirementID: requirement_id,
              } );
          } )
          .catch( ( error ) => {
              util.handleError( error );
          } );
      // }
  };

  render() {
      if ( this.state.requirementID !== null ) {
          return <Redirect to={`/jobs/`} />;
      }
      return (
          <Fragment>
              <TitleAndLink />
              <Paper elevation={1} className={"mt-2"}>
                  <div className="container-fluid">
                      <div className="row">
                          {this.state.isLoading ?
                              <Fragment>
                                  <center className="col-md-12 m-5"><CircularProgress /></center>
                              </Fragment>:
                              <Fragment>
                                  <div className="col-md-12 pt-2">
                                      <FormJobPosition
                                          catalog_job_desc={this.state.catalog_job_desc}
                                          job={this.state.job}
                                          index={this.state.jobIndex}
                                          selectAction={this.selectAction}
                                          handleChange={this.handleChange}
                                      />
                                      <div className="float-md-right float-sm-none m-2">
                                          {/*<button   className="btn btn-default mr-2" >CANCEL</button>*/}
                                          <button  className="btn btn-primary" onClick={() => this.saveJobOpening()} >SAVE</button>
                                      </div>
                                  </div>
                              </Fragment>}

                      </div>
                      <ModalSelectPartnerClient
                          selectedData={this.selectedData}
                          hideModal={this.hideModal}
                          modalVisible={this.state.modalVisible}
                          modalType={this.state.modalType}
                      />
                  </div>

              </Paper>
          </Fragment>
      );
  }
}

export default NewRequirement;

function FormJobPosition( props ) {
    const [catalog, setCatalog] = useState( [] );
    const [job, setJobData] = useState( props.job );
    const [isVisible, setIsVisible] = useState( true );
    const [recruiters, setRecruiters] = useState( [] );
    const [marginShow, setMarginShow] = useState( false );
    const [modalType, setModalType] = useState( false );
    const [modalVisible, setModalVisible] = useState( false );



    useEffect( () => {
        // let s = selector.states( 1 );
        // setStates( s );

        getRecruiters().then( null );

    }, [] );

    useEffect( () => {
    // Refresh al fields with the data of the selected job from the sidebar
        setJobData( props.job );
        setCatalog( props.catalog_job_desc );
        return () => {};
    }, [props.index, props.catalog_job_desc, props] );

    function handleChange( e ) {
        const { name, value } = e.target;
        if ( name === "deal_type" ){
            if ( value === "Direct Client" ){
                // Hide partner button
                setIsVisible( false );
            }else{
                setIsVisible( true );
            }
        }
        props.handleChange( name, value );
    }


    function handleChangeAutoComplete( value ) {
        props.handleChange( "job_title", value );
        // must trigger job description
        const j = catalog.filter( ( j ) => j.title === value )[0];
        props.handleChange( "job_description", j.description );
    }

    function handleRichTextChange( e ) {
        const value = e.toString( "html" );
        props.handleChange( "job_description", value );
    }

    async function getRecruiters() {
        try {
            const request = await util.axios.get( `${util.url}/app_resources/users_by_role/1` );
            const { error, msg, users } = request.data;
            if ( error ) throw msg;
            setRecruiters( users );
        } catch ( error ) {
            util.handleError( error );
        }
    }
    function onConfirmLowerMargin() {
        // setMarginLower( true );
    }

    
    function selectedData ( opc, data ) {
        let jobTemp  = job;
        if ( opc === PARTNER ) {
            jobTemp.partner =  data;
        } else {
            jobTemp.client =  data;
        }
        setJobData( Object.assign( {}, jobTemp ) );
    }
    function hideModal(){
        setModalType( PARTNER );
        setModalVisible( false );
    }
    return (
        <Fragment>
            <div className="row">
                {/* LEFT SECTION */}
                <div className="col-md-6">
                    <div className="row">
                        <div className="col-md-9">
                            <Autocomplete
                                freeSolo
                                id="free-solo-2-demo"
                                disableClearable
                                onChange={( e, value ) => handleChangeAutoComplete( value )}
                                options={catalog.map( ( option ) => option.title )}
                                renderInput={( params ) => (
                                    <TextField
                                        {...params}
                                        label="Job Title *"
                                        margin="normal"
                                        name="job_title"
                                        value={job.job_title}
                                        onChange={handleChange}
                                        variant="standard"
                                        InputProps={{ ...params.InputProps, type: "search" }}
                                    />
                                )}
                            />
                        </div>
                        <util.RowComponent
                            c={3}
                            t={"Certification"}
                            n={"certification"}
                            m={handleChange}
                            v={job.certification||""}
                        />
                    </div>
          
                    {/*<b>Skills and Scope</b>*/}
                    <div className="form-row">
                        <util.RowComponent
                            c={4}
                            t={"Primary Skill"}
                            n={"primary_skill"}
                            m={handleChange}
                            v={job.primary_skill || ""}
                        />
                        <util.RowComponent
                            c={4}
                            t={"Secondary Skill"}
                            n={"secondary_skill"}
                            m={handleChange}
                            v={job.secondary_skill || ""}
                        />
  
                        <util.RowComponent
                            c={4}
                            t={"Role"}
                            n={"role"}
                            m={handleChange}
                            v={job.role || "Technician"}
                            type={1}
                            d={selector.role()}
                        />
                        <util.RowComponent
                            c={4}
                            t={"Scope"}
                            n={"scope"}
                            m={handleChange}
                            v={job.scope || "Project Support"}
                            type={1}
                            d={selector.scope()}
                        />
                        <util.RowComponent
                            c={4}
                            t={"Level"}
                            n={"level"}
                            m={handleChange}
                            v={job.level || "Experienced (L2)"}
                            type={1}
                            d={selector.level()}
                        />
                        <util.RowComponent
                            c={4}
                            t={"Education"}
                            n={"education"}
                            m={handleChange}
                            v={job.education || "University"}
                            type={1}
                            d={selector.education()}
                        />
            

                    </div>
                    <div className="paddingleft0 col-md-12 mt-2">
                        <label className="text-muted textSmallLH">Job Description</label>
                        <Editor
                            apiKey="fh4ytbvlmezimxly55fsth1vxjri393t9m5wbk6a1g5voo3c"
                            value={job.job_description || ""}
                            init={{
                                height: 500,
                                menubar: false,
                                toolbar:
                      "formatselect | bold italic| alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | removeformat"
                            }}
                            onEditorChange={handleRichTextChange}
                        />
                    </div>
                </div>

                {/* RIGHT SECTION */}
                <div className="col-md-6">
                    <b style={{ marginLeft:"-2px" }}>Basic Information</b>
                    <div className="row">
                        <div className={`col-md-3 p-1 mt-2`}>
                            <TextField
                                select
                                size={"small"}
                                name="deal_type"
                                className="w-100"
                                label="Deal Type"
                                value={job.deal_type || "Channel Partner"}
                                onChange={handleChange}
                                InputLabelProps={{ shrink: true }}
                                SelectProps={{
                                    native: true
                                }}
                  
                            >
                                {selector.dealType().map( option => (
                                    <option key={Math.random() * Math.random() } value={option["deal_type"]}>
                                        {option["deal_type"]}
                                    </option>
                                ) )}
                            </TextField>
                        </div>
                        { isVisible ?
                            <div className={`col-md-3 col-xs-12 p-1 mt-2`}>
                                {!job.partner ? <div className="text-center"><Button onClick={()=> props.selectAction( PARTNER )} id="btnS" variant={"outlined"}>
                      Select Partner
                                </Button></div>: <Fragment>
                                    <b>Partner information</b>
                                    <util.BoxSimple data={job.partner} editInfo={()=>props.selectAction( PARTNER )} />
                                </Fragment>}
                            </div>:""}
                        <div className={`col-md-3 col-xs-12 p-1 mt-2`}>
                            {/*<label className="labelButtons" htmlFor={"btnClient"}>End Client</label>*/}
                            {!job.client ? <div className="text-center"><Button onClick={()=> props.selectAction( CLIENT )} id="btnClient" variant={"outlined"}>
                  Select Client
                            </Button></div>: <Fragment>
                                <b>Client information</b>
                                <util.BoxSimple data={job.client} editInfo={()=>props.selectAction( CLIENT )}/>
                            </Fragment>}
                        </div>
                        <div className={`col-md-3 col-xs-12 p-1  mt-2`}>
                            <div className={classLabelsMUI}>Client Reference ID</div>
                            <util.RowComponent
                                n={"client_requirement_id"}
                                m={handleChange}
                                v={job.client_requirement_id || ""}
                            />
                        </div>
                    </div>
                    <div className="form-row">
                        <util.RowComponent
                            c={3}
                            t={"Employment Type"}
                            n={"employment_type"}
                            m={handleChange}
                            v={job.employment_type || "Any"}
                            type={1}
                            d={selector.employment_type()}
                        />
                        <util.RowComponent
                            c={3}
                            t={"Restricted To"}
                            n={"restricted_to"}
                            m={handleChange}
                            v={job.restricted_to}
                            type={1}
                            d={selector.restricted_to()}
                        />

                        <util.RowComponent
                            c={3}
                            t={"Duration in months *"}
                            n={"duration"}
                            m={handleChange}
                            v={job.duration}
                        />

                        <util.RowComponent
                            c={3}
                            t={"Priority"}
                            n={"priority"}
                            m={handleChange}
                            v={job.priority || "Mid"}
                            type={1}
                            d={selector.priority()}
                        />

                    </div>
                    <b>Compensation Range</b>
                    <div className="form-row">
  
                        <div className={`col-md-3 p-1 mt-2 align-self-center`}>
                            <TextField
                                size={"small"}
                                className="w-100"
                                InputLabelProps={{ shrink: true }}
                                value={ job.buy_from || "" }
                                type="number"
                                label="Minimum"
                                fullWidth={true}
                                InputProps={{
                                    startAdornment: util.symbolDependingCurrencySelected( job.country )
                                }}
                                variant="standard"
                                name="buy_from"
                                onChange={handleChange}
                            />
                        </div>
  
  
                        <div className={`col-md-3 p-1 mt-2 align-self-center`}>
                            <TextField
                                size={"small"}
                                className="w-100"
                                InputLabelProps={{ shrink: true }}
                                value={ job.buy_to || "" }
                                type="number"
                                label="Maximum"
                                fullWidth={true}
                                InputProps={{
                                    startAdornment: util.symbolDependingCurrencySelected( job.country )
                                }}
                                variant="standard"
                                name="buy_to"
                                onChange={handleChange}
                            />
                        </div>
  
  
                        <div className={`col-md-3 p-1 mt-2 align-self-center`}>
                            <TextField
                                size={"small"}
                                className="w-100"
                                InputLabelProps={{ shrink: true }}
                                value={ job.sell_rate || "" }
                                type="number"
                                label="Job Sell Rate"
                                fullWidth={true}
                                InputProps={{
                                    startAdornment: util.symbolDependingCurrencySelected( job.country )
                                }}
                                variant="standard"
                                name="sell_rate"
                                onChange={handleChange}
                            />
                        </div>
                      

                        <util.RowComponent
                            c={3}
                            t={"Yearly, Monthly, Hourly"}
                            n={"sell_rate_type"}
                            m={handleChange}
                            v={job.sell_rate_type || "Hourly"}
                            type={1}
                            d={selector.sell_rate_type2}
                        />
                    </div>

                    <b>Location</b>
                    <div className="form-row">

                        <LocationCX
                            cols={4}
                            data={job} // contains everything
                            onChange={handleChange}
                            requiredData={{
                                state: false,
                                country: false,
                                city: true,
                            }}
                        />
            
                        <util.RowComponent
                            c={3}
                            t={"Zip Code"}
                            n={"zipCode"}
                            m={handleChange}
                            v={job.zipCode || ""}
                        />
                    </div>

          

                    <b>Onboarding Contacts</b>
                    <div className="form-row">
                        <util.RowComponent
                            c={4}
                            t={"Reporting Manager"}
                            n={"reporting_manager"}
                            m={handleChange}
                            v={job.reporting_manager || ""}
                        />
                        <util.RowComponent
                            c={4}
                            t={"Reporting Manager Phone"}
                            n={"reporting_manager_phone"}
                            m={handleChange}
                            v={job.reporting_manager_phone||""}
                        />
                        <util.RowComponent
                            c={4}
                            t={"Reporting Manager Address"}
                            n={"reporting_manager_address"}
                            m={handleChange}
                            v={job.reporting_manager_address||""}
                        />

                        <div className={`col-md-4 p-1 mt-2`}>
                            <TextField
                                select
                                name="sales_lead"
                                className="w-100"
                                label="Sales Lead *"
                                value={job.sales_lead || "None"}
                                onChange={handleChange}
                                InputLabelProps={{ shrink: true }}
                                SelectProps={{ native: true }}
                            >
                                <option value=""> -- </option>
                                {recruiters.map( ( option, index ) => (
                                    <option key={ index } value={option.id}>
                                        {option.name}
                                    </option>
                                ) )}
                            </TextField>
                        </div>

                        <div className={`col-md-4 p-1 mt-2`}>
                            <TextField
                                select
                                name="lead_recruiter"
                                className="w-100"
                                label="Lead Recruiter *"
                                value={job.lead_recruiter || "None"}
                                onChange={handleChange}
                                InputLabelProps={{ shrink: true }}
                                SelectProps={{ native: true }}
                            >
                                <option value=""> -- </option>
                                {recruiters.map( ( option, index ) => (
                                    <option key={ index } value={option.id}>
                                        {option.name}
                                    </option>
                                ) )}
                            </TextField>
                        </div>

                        <div className={`col-md-4 p-1 mt-2`}>
                            <TextField
                                select
                                name="secondary_recruiter"
                                className="w-100"
                                label="Secondary Recruiter"
                                value={job.secondary_recruiter || "None"}
                                onChange={handleChange}
                                InputLabelProps={{ shrink: true }}
                                SelectProps={{ native: true }}
                            >
                                <option value=""> -- </option>
                                {recruiters.map( ( option, index ) => (
                                    <option key={ index } value={option.id}>
                                        {option.name}
                                    </option>
                                ) )}
                            </TextField>
                        </div>


                    </div>
                    <div className="form-row">

                    </div>

                </div>
            </div>

            {marginShow ?
                <SAlert
                    show={marginShow}
                    confirmText="Yes"
                    typeButton="warning"
                    msg={"Do you want to use a lower margin in this Job?"}
                    hideAlert={setMarginShow( false )}
                    onConfirm={onConfirmLowerMargin}
                    opc={0}
                />:""}

            <ModalSelectPartnerClient
                selectedData={selectedData}
                hideModal={hideModal}
                modalVisible={modalVisible}
                modalType={modalType}
            />
        </Fragment>
    );
}

function TitleAndLink() {
    return <Fragment>
        <div className="row">
            <div className="col-md-6">
                <h4 className="text-black-50 mt-2">Add New Job</h4>
            </div>
            <div className="col-md-6">
                <NavLink to="/jobs" className="float-right align-bottom text-decoration-none mt-2" ><FontAwesomeIcon icon={faArrowLeft}/> Back</NavLink>
            </div>
        </div>
    </Fragment>;
}
