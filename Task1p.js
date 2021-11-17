const NewRequirement = (props) => {
    const [hideModal, setHideModal] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [ modalType, setModalType] = useState(PARTNER);
    const [job, setJob] = useState( selector.job_position_base());
    const [requirementID, setRequirementID] = useState(null);
    const [ catalog_job_desc, setCatalog_job_desc] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
  
    useEffect(() => {
        getCatalog().then( null );
    }, []);
  const  getCatalog = async () => {
    // Make a request for catalog of job descriptions
    try {
        const { data } = await util
            .axios
            .get( `${util.url}/app_resources/job_descriptions` );
        if ( data.error ) throw data.msg;
        setCatalog_job_desc(data.job_descriptions), 
            setIsLoading(false)
    } catch ( error ) {
        util.handleError( error );
    }
};
const selectAction = ( modalOption ) => {
   
    setModalType( modalOption),
       setModalVisible(true)
}
const hideModal = () => {
    
       setModalType(PARTNER),
        setModalVisible(false)
    
};
const handleChange = ( name, value ) => {
    let job = job;
    job[name] = value;
    setJob({job})
};
const selectedData = ( opc, data ) => {
    const job  = job;
    if ( opc === PARTNER ) {
        job.partner =  data;
    } else {
        job.client =  data;
    }
    setJob({job}) 
};
const saveJobOpening = () => {
    util
        .axios
        .post( `${util.baseUrl()}/jobs/new`, { job: this.state.job } )
        .then( ( response ) => {
            const { error, msg, requirement_id } = response.data;
            if ( error ) return util.toast().error( msg );
            util.toast().success( msg );
           
                setRequirementID(requirement_id)
            
        } )
        .catch( ( error ) => {
            util.handleError( error );
        } );
    // }
};
if ( requirementID !== null ) {
    return <Redirect to={`/jobs/`} />;
}
return (
    <Fragment>
        <TitleAndLink />
        <Paper elevation={1} className={"mt-2"}>
            <div className="container-fluid">
                <div className="row">
                    {isLoading ?
                        <Fragment>
                            <center className="col-md-12 m-5"><CircularProgress /></center>
                        </Fragment>:
                        <Fragment>
                            <div className="col-md-12 pt-2">
                                <FormJobPosition
                                    catalog_job_desc={catalog_job_desc}
                                    job={job}
                                    index={jobIndex}
                                    selectAction={selectAction()}
                                    handleChange={handleChange()}
                                />
                                <div className="float-md-right float-sm-none m-2">
                                    {/*<button   className="btn btn-default mr-2" >CANCEL</button>*/}
                                    <button  className="btn btn-primary" onClick={() => saveJobOpening()} >SAVE</button>
                                </div>
                            </div>
                        </Fragment>}

                </div>
                <ModalSelectPartnerClient
                    selectedData={selectedData()}
                    hideModal={hideModal()}
                    modalVisible={modalVisible}
                    modalType={modalType}
                />
            </div>

        </Paper>
    </Fragment>
);
}


export default NewRequirement;



