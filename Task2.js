

class PositionDetail extends Component {
    constructor( props ) {
        super( props );
        const { match: { params } } = this.props;
        const query = new URLSearchParams( this.props.location.search );
        const opc = query.get( 'opc' );
        this.state = {
            position_id: params.id,
            settings: null,
            position: null,
            candidates: [],
            positionId: null,
            modalVisible: false,
            isLoading: true,
            backDropOpen: false,
            stopProcessShow: false,
            stopProcessTalentShow: false,
            reStartProcessTalentShow: false,
            deleteTalentShow: false,
            deleteTalentsShow: false,
            positionFilledShow: false,
            changeStatusShow: false,
            sendEmail: false,
            forceRender: null,
            ids: [],
            selectedRows: [],
            data: null,
            submitModal: false,
            showModalDocuments: false,
            expanded: opc ? 'panel1' : 'panel2',
            applyChanges: null,
            cancelChanges: null,
            changeStatusModal: false,
            statusSelected: null,
            showModalCTCSettings: false
        };
    }

    async componentDidMount() {
        // After the component is mounted, retrieves the settings
        const settings = await SettingRequest.getSettings();
        this.setState( { settings }, () => {
            this.getJobPositionInformation();
        } );
    }

    getJobPositionInformation = async () => {
        // After component mount, make the request to get the "positions of the current requirement"
        try {
            const request = await util.axios.get(
                `${util.url}/requirements/job_position_information/${this.state.position_id}`
            );
            const { error, msg, position } = request.data;
            if ( error ) throw msg;
            // Send position data to redux
            this.props.setPosition( position );
            this.setState( {
                position,
                newStatus: util.jobStatusOnlyIcons( position.status ),
            } );
            await this.showCandidatesOfPosition( this.state.position_id );
        } catch ( error ) {
            util.handleError( error );
        }
    };

    removeCandidateFromPosition = async () => {
        // This is activated after user confirm that wants to remove the talent using the trash icon
        try {
            const { position_id, candidate_id } = this.state.data;
            const request = await util.axios.delete(
                `${util.url}/requirements/remove_candidate_from_position/${position_id}/${candidate_id}`
            );
            const { error, msg, candidates } = request.data;
            if ( error ) throw msg;
            // Send talents to redux
            this.props.setCandidates( candidates );

            this.setState( {
                positionId: position_id,
                deleteTalentShow: false,
            } );
        } catch ( error ) {
            this.setState( { deleteTalentShow: false } );
            util.handleError( error );
        }
    };

    deleteCandidates = async () => {
        try {
            let data = this.state.data;
            // Get the talents ids that were selected
            let ids = [];
            for ( let x = 0; x < data.length; x++ ) {
                if (
                    parseInt( data[x].status ) !== 19 &&
                    parseInt( data[x].status ) !== 13
                ) {
                    // 19 dropped, 13 on boarded
                    ids.push( data[x].candidate_id );
                }
            }
            // Get position_id from the first candidate
            const position_id = data[0].position_id;
            const request = await util.axios.post(
                `${util.url}/requirements/remove_candidates_from_position/${position_id}`,
                ids
            );
            const { error, msg, candidates } = request.data;
            if ( error ) throw msg;
            // Send talents to redux
            this.props.setCandidates( candidates );
            this.setState( {
                positionId: position_id,
                deleteTalentsShow: false,
            } );
        } catch ( error ) {
            util.handleError( error );
        }
    };

    showCandidatesOfPosition = async id => {
        // Retrieves the list of talents inside this job position
        try {
            const request = await util.axios.get(
                `${util.url}/requirements/candidates_of_position/${id}`
            );
            let { error, msg, candidates } = request.data;
            if ( error ) throw msg;

            if ( candidates.length > 0 ) {
                // Also get information about pending evaluation reviews
                const ids = [];
                candidates.map( c => ids.push( c.id ) );
                const p = { jobId: id, ids: ids };
                const requestEvaluations = await util.axios.post(
                    `${util.url}/job/talent_has_pending_review`,
                    p
                );
                let { talentPendingEvaluationReview } = requestEvaluations.data;

                if ( talentPendingEvaluationReview.length > 0 ) {
                    for ( let i = 0; i < candidates.length; i++ ) {
                        talentPendingEvaluationReview.map( t => {
                            if ( t.talent_id === candidates[i].id ) {
                                candidates[i].pendingEvaluationReview = t.hasPending;
                            }
                        } );
                    }
                }
            }

            // Send talents to redux
            this.props.setCandidates( Object.assign( [], candidates ) );
            this.setState( {
                positionId: id,
                isLoading: false,
            } );
        } catch ( error ) {
            util.handleError( error );
        }
    };

    addCandidate = () => {
        // Enable modal to add talent to the job
        this.setState( { modalVisible: true } );
    };

    hideModal = () => {
        // Hide the modal used to add talents to the job
        this.setState( { modalVisible: false } );
    };

    handleChangePanel = panel => () => {
        // Handles which panel is expanded
        this.setState( {
            expanded: panel === this.state.expanded
                ? panel === 'panel1' ? 'panel2' : 'panel1'
                : panel,
        } );
    };

    onConfirmChangeStatus = async () => {
        try {
            // Change status of the job position between Active or HOLD
            this.setState( { changeStatusShow: false, backDropOpen: true } );
            let ids = [];
            ids.push( this.state.position.id );
            // newStatus have the next status of the selected positions
            const newStatus = this.state.position.status === 1 ? 2 : 1;
            const request = await util.axios.put(
                `${util.url}/jobs/change_status_job_process`,
                { jobs: ids, newStatus, sendEmail: this.state.sendEmail }
            );
            const { error, msg } = request.data;

            if ( error ) throw msg;
            util.toast().success( msg );
            await this.getJobPositionInformation();
            this.setState( { backDropOpen: false, sendEmail: false } );
        } catch ( e ) {
            this.setState( { backDropOpen: false, sendEmail: false } );
            util.handleError( e );
        }
    };

    onConfirmStopProcess = async () => {
        // Stop the process of this job position
        try {
            this.setState( { stopProcessShow: false, backDropOpen: true } );
            let ids = [];
            ids.push( this.state.position.id );
            const request = await util.axios.put(
                `${util.url}/jobs/stop_job_process`,
                { jobs: ids, sendEmail: this.state.sendEmail }
            );
            const { error, msg } = request.data;
            if ( error ) throw msg;
            util.toast().success( msg );
            await this.getJobPositionInformation();
            this.setState( { backDropOpen: false, sendEmail: false  } );
        } catch ( e ) {
            this.setState( { backDropOpen: false, sendEmail: false  } );
            util.handleError( e );
        }
    };

    onPositionFilled = async () => {
        // Mark this job position as FILLED
        try {
            this.setState( { positionFilledShow: false, backDropOpen: true } );
            const request = await util.axios.put(
                `${util.url}/jobs/job_position_filled/${this.state.position.id}`,
                { sendEmail: this.state.sendEmail }
            );
            const { error, msg } = request.data;
            if ( error ) throw msg;
            util.toast().success( msg );
            await this.getJobPositionInformation();
            this.setState( { backDropOpen: false, sendEmail: false } );
        } catch ( e ) {
            this.setState( { backDropOpen: false, sendEmail: false } );
            util.handleError( e );
        }
    };

    hideModalStopProcess = () => {
        this.setState(
            {
                stopProcessTalentShow: false,
                backDropOpen: false,
            },
            () => {
                this.showCandidatesOfPosition( this.state.position_id ).then(
                    () => null
                );
            }
        );
    };

    hideModalReStartProcess = () => {
        this.setState(
            {
                reStartProcessTalentShow: false,
                backDropOpen: false,
            },
            () => {
                this.showCandidatesOfPosition( this.state.position_id ).then(
                    () => null
                );
            }
        );
    };

    onChangeEmploymentType = async e => {
        try {
            const { position_id, candidate_id } = e.rowData;
            const { value } = e.target;
            let data = { field: SELECT_EMPLOYMENT_TYPE, value };
            const request = await util.axios.patch(
                `${util.url}/job/update_talent_position_rates/${position_id}/${candidate_id}`,
                data
            );
            const { error, msg } = request.data;
            let temp = this.props.candidates;
            temp.forEach( ( candidate, index ) => {
                if ( candidate.id === candidate_id ) {
                    temp[index].employment_type = value;
                    temp[index].talent_desc_updated = 'Employment Type Updated';
                }
            } );
            console.log( temp );
            this.props.setCandidates( temp );
            this.props.setPosition( temp );
            if ( error ) throw msg;
        } catch ( e ) {
            util.handleError( e );
        }
    };

    updateChange = ( job = null ) => {
        if ( job ) {
            this.setState( { position: job } );
        }
        this.showCandidatesOfPosition( this.state.position_id ).then( null );
    };

    refreshTalentTable = () => {
        // this.props.talents.map((c,i)=> console.log(c.talent_expectation))
        //
        // this.showCandidatesOfPosition(this.state.position_id).then(r => null);
        // this.setState({forceRender: Math.random * Math.random})
    };

    submitTalentsModal() {
        this.setState( { submitModal: true } );
    }

    async changeStatusOfTalent( option ) {
        try {
            let ids = [];
            for ( let x = 0; x < this.state.selectedRows.length; x++ ) {
                const element = this.state.selectedRows[x];
                ids.push( element.candidate_id );
            }

            const { id } = this.state.position;

            const request = await util.axios.patch(
                `job/update_talent_position_status/${id}`,
                { talents: ids, newStatus: option }
            );
            const { error, msg, candidates } = request.data;

            if ( error ) throw msg;
            this.setState( { changeStatusModal: false, statusSelected: null } );
            this.props.setCandidates( candidates );

        } catch ( e ) {
            util.handleError( e );
        }
    }

    sendEmailCheckbox = ( e ) => {
        const { name, value, checked } = e.target;
        console.log(  name, value, checked );
        this.setState( { sendEmail: checked } );
    }

    whatsAppImage = "/images/whatsapp.png"

    render() {
        if ( this.state.isLoading ) {
            return (
                <div className="pt-5 mt-5 text-center">
                    <CircularProgress/>
                </div>
            );
        }
        return (
            <Fragment>
                <div>
                    <Link to={'/jobs'}>
                        <FontAwesomeIcon icon={faArrowLeft} className={'mr-2'}/>
                        Back to Jobs
                    </Link>
                </div>
                <div className="row mt-2">
                    <div className="col-md-12 mb-1">
                        <Accordion
                            expanded={this.state.expanded === 'panel1'}
                            onChange={this.handleChangePanel( 'panel1' )}
                        >
                            <AccordionSummary
                                expandIcon={
                                    <FontAwesomeIcon
                                        icon={faCaretDown}
                                        className="titleExpandible"
                                    />
                                }
                            >
                                <div className="w-100 d-flex justify-content-around">
                                    <TitleExpansion position={this.state.position}/>
                                    <div
                                        onClick={( event ) => event.stopPropagation()}
                                        onFocus={( event ) => event.stopPropagation()}
                                        className="w-50 pl-2 d-flex justify-content-end"
                                    >

                                        <DropDownOptions jobArray={ [this.state.position] } reloadTableData={this.getJobPositionInformation} />
                                        {
                                            this.state.position?.ctc_settings ?
                                                <Fragment>
                                                    <button className="btn btn-sm" onClick={()=> this.setState( { showModalCTCSettings: true } ) } >
                                                        <Tooltip title="Modify CTC settings on this job">
                                                            <span>
                                                                <FontAwesomeIcon icon={faCogs} className="mr-1 ml-1" />
                                                            </span>
                                                        </Tooltip>
                                                    </button>
                                                    {
                                                        this.state.showModalCTCSettings ?
                                                            <ModalJobSetting
                                                                job={this.state.position}
                                                                show={this.state.showModalCTCSettings}
                                                                ctcSetting={this.state.position?.ctc_settings }
                                                                handleClose={()=>this.setState( { showModalCTCSettings: false } )}
                                                            />
                                                            :
                                                            null
                                                    }

                                                </Fragment>
                                                :
                                                null
                                        }




                                        {this.state.expanded === 'panel1'
                                            ? <Fragment>
                                                {
                                                    this.state.position.status === 1 ?
                                                        <Fragment>
                                                            <button
                                                                onFocus={event => event.stopPropagation()}
                                                                onClick={e => {
                                                                    e.stopPropagation();
                                                                    this.setState( {
                                                                        ...this.state,
                                                                        cancelChanges: Math.random() * 2,
                                                                    } );
                                                                }}
                                                                className={'btn text-danger ml-2 btn-sm'}
                                                            >
                                                                <FontAwesomeIcon icon={faTimes} className="mr-1"/>
                                                            Cancel
                                                            </button>
                                                            <button
                                                                onFocus={event => event.stopPropagation()}
                                                                onClick={event => {
                                                                    event.stopPropagation();
                                                                    this.setState( {
                                                                        ...this.state,
                                                                        applyChanges: Math.random() * 3,
                                                                    } );
                                                                }}
                                                                className={'btn btn-primary ml-2 btn-sm'}
                                                            >
                                                                <FontAwesomeIcon icon={faSave} className="mr-1"/>
                                                            Save
                                                            </button>
                                                        </Fragment>
                                                        :
                                                        null    
                                                }
                                            </Fragment>
                                            : null}
                                    </div>
                                </div>
                            </AccordionSummary>
                            <AccordionDetails>
                                <JobPositionForm
                                    job={this.props.position}
                                    handleChange={this.updateChange}
                                    updateChanges={this.state.applyChanges}
                                    cancelChanges={this.state.cancelChanges}
                                    talents={this.props.candidates}
                                />
                            </AccordionDetails>
                        </Accordion>
                    </div>
                </div>
                <div className="row">
                    <div className="col-md-12">
                        <Accordion
                            expanded={this.state.expanded === 'panel2'}
                            onChange={this.handleChangePanel( 'panel2' )}
                        >
                            <AccordionSummary
                                expandIcon={
                                    <FontAwesomeIcon
                                        icon={faCaretDown}
                                        className={'titleExpandible'}
                                    />
                                }
                            >
                                <b className={'titleExpandible'}>Talent List</b>
                            </AccordionSummary>
                            <AccordionDetails>
                                <div className="container-fluid">
                                    <MuiThemeProvider theme={util.defaultTableTheme}>
                                        <MaterialTable
                                            columns={[
                                                {
                                                    title: '',
                                                    field: '',
                                                    hidden: this.state.position.ctc_settings === null ,
                                                    sorting: false,
                                                    disableClick: true,
                                                    render: data => {
                                                        return (
                                                            <button
                                                                onClick={()=> {
                                                                    this.setState( { talentRowData: data, showDrawer: true } );
                                                                }}
                                                                className="btn btn-sm btn-primary btnsmall">
                                                                <Tooltip title="Edit Cost">
                                                                    <span>
                                                                        <FontAwesomeIcon icon={faHandHoldingUsd} />
                                                                    </span>
                                                                </Tooltip>
                                                            </button>
                                                        );
                                                    }
                                                },
                                                {
                                                    title: 'Talent ID',
                                                    field: 'id',
                                                    disableClick: true,
                                                    render: data => {
                                                        return (
                                                            <div className="justify-content-between">
                                                                <Link
                                                                    to={`/candidates/${data.id}?jp=true&job_id=${this.state.position_id}`}
                                                                >
                                                                    {data.id}
                                                                </Link>
                                                            </div>
                                                        );
                                                    },
                                                },
                                                {
                                                    title: 'Status',
                                                    field: 'status',
                                                    render: data => {
                                                        return (
                                                            <div className="text-center">
                                                                {util.candidateStatus(
                                                                    data.status,
                                                                    data['status_note']
                                                                )}
                                                            </div>
                                                        );
                                                    },
                                                },
                                                {
                                                    title: 'Name',
                                                    field: 'name',
                                                    render: data => {
                                                        return (
                                                            <div className="justify-content-between">
                                                                {data.pendingEvaluationReview
                                                                    ? <Tooltip title="Evaluated">
                                                                        <span>
                                                                            <FontAwesomeIcon
                                                                                icon={faExclamationTriangle}
                                                                                className="text-warning"
                                                                            />
                                                                        </span>
                                                                    </Tooltip>
                                                                    : null}
                                                                {data.resume
                                                                    ? <a
                                                                        target={'_blank'}
                                                                        rel="noopener noreferrer"
                                                                        href={util.resumeUrl( data )}
                                                                    >
                                                                        <FontAwesomeIcon
                                                                            icon={faPaperclip}
                                                                            className="mr-2"
                                                                        />
                                                                    </a>
                                                                    : ''}
                                                                <Link
                                                                    to={`/candidates/${data.id}?jp=true&job_id=${this.state.position_id}`}
                                                                >
                                                                    {data.name}
                                                                </Link>
                                                            </div>
                                                        );
                                                    },
                                                },
                                                {
                                                    title: 'Email',
                                                    field: 'email',
                                                    disableClick: true,
                                                    render: data => {
                                                        return (
                                                            <Fragment>
                                                                <a href={`mailto:${data.email}`}>
                                                                    {data.email}
                                                                </a>
                                                            </Fragment>
                                                        );
                                                    },
                                                },
                                                {
                                                    title: 'Phone',
                                                    field: 'phone_mobile',
                                                    disableClick: true,
                                                    render: data => {
                                                        return (
                                                            <Fragment>
                                                                <DropdownButton
                                                                    size="sm"
                                                                    variant="secondary"
                                                                    title="Call/Message"
                                                                >
                                                                    <Dropdown.Item
                                                                        href={`tel:${data.phone_mobile}`}
                                                                    >
                                                                        <FontAwesomeIcon
                                                                            icon={faPhone}
                                                                            className="mr-1"
                                                                        />
                                                                        {util.formatPhone( data.phone_mobile )}
                                                                    </Dropdown.Item>
                                                                    <Dropdown.Item
                                                                        target="new"
                                                                        href={util.whatsapp(
                                                                            data.phone_mobile,
                                                                            `Hello, my name is ${util.user.name} from eJAmerica`
                                                                        )}
                                                                    >
                                                                        <img
                                                                            width={16}
                                                                            src={this.whatsAppImage}
                                                                            alt="whatsapp"
                                                                            className="mr-1"
                                                                        />
                                                                        Send WhatsApp
                                                                    </Dropdown.Item>
                                                                </DropdownButton>
                                                            </Fragment>
                                                        );
                                                    },
                                                },
                                                {
                                                    title: 'Location',
                                                    field: 'city',
                                                    render: data => {
                                                        return util.location(
                                                            data.country,
                                                            data.state,
                                                            data.city
                                                        );
                                                    },
                                                },
                                                {
                                                    title: 'Employment Type',
                                                    disableClick: true,
                                                    customSort: ( a, b ) => a.ctc_settings.employmentType.length - b.ctc_settings.employmentType.length,
                                                    hidden: this.state.position.ctc_settings === null,
                                                    render: data => {return data.ctc_settings.employmentType;},
                                                },
                                                {
                                                    title: 'Sell Margin',
                                                    disableClick: true,
                                                    customSort: ( a, b ) => a.ctc_settings.sell_margin -b.ctc_settings.sell_margin,
                                                    hidden: this.state.position.ctc_settings === null,
                                                    render: data => {
                                                        return  util.marginColors( data.ctc_settings.sell_margin );
                                                    },
                                                },
                                                {
                                                    title: 'eJOffer',
                                                    disableClick: true,
                                                    customSort: ( a, b ) => a.ctc_settings.ejOffer -b.ctc_settings.ejOffer,
                                                    hidden: this.state.position.ctc_settings === null,
                                                    render: data => {return util.currencyFormat( data.ctc_settings.ejOffer, data.job.country );},
                                                },
                                                {
                                                    title: 'CTC Per Hour',
                                                    disableClick: true,
                                                    customSort: ( a, b ) => a.ctc_settings.ctcPerHour -b.ctc_settings.ctcPerHour,
                                                    hidden: this.state.position.ctc_settings === null,
                                                    render: data => {return util.currencyFormat( data.ctc_settings.ctcPerHour, data.job.country );},
                                                },
                                                {
                                                    title: 'Sell Rate Per Hour',
                                                    disableClick: true,
                                                    customSort: ( a, b ) => a.ctc_settings.sellRatePerHour -b.ctc_settings.sellRatePerHour,
                                                    hidden: this.state.position.ctc_settings === null,
                                                    render: data => {return util.currencyFormat( data.ctc_settings.sellRatePerHour, data.job.country );},
                                                },
                                                // {
                                                //     title: 'Employment Type - Sell Margin - ',
                                                //     disableClick: true,
                                                //     hidden: this.state.position.ctc_settings === null,
                                                //     render: data => {
                                                //         console.log(data)
                                                //         return (
                                                //
                                                //         );
                                                //     },
                                                // },
                                                {
                                                    title: 'Employment Type',
                                                    field: 'employment_type',
                                                    disableClick: true,
                                                    hidden: this.state.position.ctc_settings !== null,
                                                    render: data => {
                                                        return (
                                                            <SelectSimple
                                                                rData={data}
                                                                onChange={this.onChangeEmploymentType}
                                                                value={data.employment_type}
                                                                name="employment_type"
                                                                data={util.employment_type}
                                                            />
                                                        );
                                                    },
                                                },
                                                {
                                                    title: 'Talent Expectation',
                                                    field: 'talent_expectation',
                                                    disableClick: true,
                                                    hidden: this.state.position.ctc_settings !== null,
                                                    render: data => {
                                                        return (
                                                            <Fragment>
                                                                <Tooltip title={'Talent expectation by HOUR'}>
                                                                    <div className="text-center">
                                                                        <ChangeSaleRate
                                                                            updateChange={this.updateChange}
                                                                            typeInput={INPUT_TALENT_EXPECTATION}
                                                                            data={data}
                                                                        />
                                                                    </div>
                                                                </Tooltip>
                                                            </Fragment>
                                                        );
                                                    },
                                                },
                                                {
                                                    title: 'eJOffer',
                                                    field: 'buy_rate',
                                                    disableClick: true,
                                                    hidden: this.state.position.ctc_settings !== null,
                                                    render: d => {
                                                        return (
                                                            <div className="text-center">
                                                                <ChangeSaleRate
                                                                    updateChange={this.updateChange}
                                                                    typeInput={INPUT_BUY_RATE}
                                                                    data={d}
                                                                />
                                                            </div>
                                                        );
                                                    },
                                                },
                                                {
                                                    title: 'T Sell rate',
                                                    field: 'talent_sell_rate',
                                                    disableClick: true,
                                                    hidden: this.state.position.ctc_settings !== null,
                                                    render: d => {
                                                        return (
                                                            <div className="text-center">
                                                                <ChangeSaleRate
                                                                    updateChange={this.updateChange}
                                                                    typeInput={INPUT_TALENT_SELL_RATE}
                                                                    data={d}
                                                                />
                                                            </div>
                                                        );
                                                    },
                                                },
                                                {
                                                    title: 'Job Sell Rate',
                                                    field: 'sell_rate',
                                                    hidden: this.state.position.ctc_settings !== null,
                                                    disableClick: true,
                                                    render: row => {
                                                        return (
                                                            <div className="text-center">
                                                                {util.currencyFormat(
                                                                    parseFloat( this.state.position.sell_rate | 0 ),
                                                                    row.job.country
                                                                )}
                                                            </div>
                                                        );
                                                    },
                                                },
                                                {
                                                    title: 'CTC',
                                                    field: 'ctc',
                                                    disableClick: true,
                                                    hidden: this.state.position.ctc_settings !== null,
                                                    customSort: ( a, b ) =>
                                                        util.calculateCTCNew( a, this.state.settings ) -
                                                        util.calculateCTCNew( b, this.state.settings ),
                                                    render: data => {
                                                        return util.currencyFormat(
                                                            util.calculateCTCNew( data, this.state.settings )
                                                        );
                                                    },
                                                },
                                                {
                                                    title: 'Margin %',
                                                    disableClick: true,
                                                    hidden: this.state.position.ctc_settings !== null,
                                                    customSort: ( a, b ) =>
                                                        util.calculateMargin( a, this.state.settings ) -
                                                        util.calculateMargin( b, this.state.settings ),
                                                    render: data => {
                                                        return util.marginColors(
                                                            util.calculateMargin( data, this.state.settings )
                                                        );
                                                    },
                                                },
                                                {
                                                    title: 'Application Date',
                                                    disableClick: true,
                                                    field: 'application_date',
                                                    render: data => {
                                                        return (
                                                            <div className="text-center">
                                                                {util.humanDate( data['application_date'] )}
                                                            </div>
                                                        );
                                                    },
                                                },
                                                {
                                                    title: 'Latest Update',
                                                    disableClick: true,
                                                    field: 'talent_updated',
                                                    render: data => {
                                                        return (
                                                            <div className="text-center">
                                                                {util.humanDate( data['talent_updated'] )}
                                                            </div>
                                                        );
                                                    },
                                                },
                                                {
                                                    title: 'Description Update',
                                                    disableClick: true,
                                                    field: 'talent_desc_updated',
                                                    render: data => {
                                                        return (
                                                            <div className="text-center">
                                                                <Tooltip
                                                                    title={
                                                                        data['talent_desc_updated']
                                                                            ? data['talent_desc_updated']
                                                                            : ''
                                                                    }
                                                                >
                                                                    <span className="text-primary">
                                                                        {' '}{data['talent_desc_updated']}
                                                                    </span>
                                                                </Tooltip>
                                                            </div>
                                                        );
                                                    },
                                                },
                                                {
                                                    title: 'Evaluation',
                                                    disableClick: true,
                                                    sorting: false,
                                                    render: data => {
                                                        return (
                                                            <div className="text-center">
                                                                <LikeDislike data={data}/>
                                                            </div>
                                                        );
                                                    },
                                                },
                                                {
                                                    title: 'Feedback',
                                                    disableClick: true,
                                                    sorting: false,
                                                    render: data => {
                                                        return (
                                                            <div className="text-center">
                                                                <Feedback data={data}/>
                                                            </div>
                                                        );
                                                    },
                                                },
                                                {
                                                    title: 'Rating',
                                                    disableClick: true,
                                                    field: 'rating',
                                                    render: data => {
                                                        return (
                                                            <div className="text-center">
                                                                <FontAwesomeIcon
                                                                    icon={faStar}
                                                                    color="gold"
                                                                    className="mr-1"
                                                                />
                                                                {data.rating ? data.rating.toFixed( 2 ) : '0'}
                                                            </div>
                                                        );
                                                    },
                                                },
                                                {
                                                    title: 'Delete',
                                                    disableClick: true,
                                                    render: data => {
                                                        return data.status === '19' ||
                                                        data.status === '11' ||
                                                        data.status === '13' || this.state.position.status !== 1
                                                            ? ''
                                                            : <div className="text-center">
                                                                <FontAwesomeIcon
                                                                    className="isPointer removeItem"
                                                                    icon={faTrashAlt}
                                                                    onClick={() => {
                                                                        this.setState( {
                                                                            data,
                                                                            deleteTalentShow: true,
                                                                        } );
                                                                    }}
                                                                />
                                                            </div>;
                                                    },
                                                },
                                            ]}
                                            data={this.props.candidates}
                                            // components={{
                                            //     Toolbar: ( toolbarProps ) => (
                                            //         <Box display="flex" alignItems="center">
                                            //
                                            //             <MTableToolbar {...toolbarProps} />
                                            //         </Box>
                                            //     ),
                                            // }}
                                            options={{
                                                pageSize: 20,
                                                pageSizeOptions: [20, 50, 100],
                                                padding: 'default',
                                                sorting: true,
                                                selection: true,
                                                showTitle: false,
                                                draggable: true,
                                                toolbarButtonAlignment: "left",
                                                emptyRowsWhenPaging: false,
                                                paginationPosition: 'both',
                                                showSelectAllCheckbox: false,
                                                selectionProps: rowData => ( {
                                                    disabled: rowData.status === '19' ||
                                                        rowData.status === '13' ||
                                                        rowData.status === '11' || this.state.position.status === 6
                                                } ),
                                            }}
                                            onSelectionChange={rows =>
                                                this.setState( { ...this.state, selectedRows: rows } )}
                                            actions={[
                                                {
                                                    icon: () => (
                                                        <Dropdown as="div" className={`dropMenuStatus`}>
                                                            <Dropdown.Toggle
                                                                as="div"
                                                                variant="success"
                                                                id="dropdown-basic"
                                                                className="customDropDownChangeStatus"
                                                            >
                                                                <Tooltip
                                                                    title="This action will not trigger any email notification">
                                                                    <span className="text-white">
                                                                            Change Status
                                                                        <FontAwesomeIcon icon={faExclamationCircle}
                                                                            className="ml-2"/>
                                                                    </span>
                                                                </Tooltip>
                                                            </Dropdown.Toggle>

                                                            <Dropdown.Menu>

                                                                <Dropdown.Item
                                                                    className="optionSubmitted"
                                                                    href="#"
                                                                    onClick={() =>
                                                                        this.changeStatusOfTalent( 22 )}
                                                                >
                                                                    <Tooltip
                                                                        title="Talent submitted">
                                                                        <span><FontAwesomeIcon icon={faPaperPlane} className="mr-2" /> Submitted</span>
                                                                    </Tooltip>
                                                                </Dropdown.Item>


                                                                <Dropdown.Item
                                                                    className="optionAccepted"
                                                                    href="#"
                                                                    onClick={() =>
                                                                        this.changeStatusOfTalent( 12 )}
                                                                >
                                                                    <Tooltip
                                                                        title="The talent is selected and move to onboarding process">
                                                                        <span><FontAwesomeIcon icon={faCheck} className="mr-2" /> Accepted</span>
                                                                    </Tooltip>
                                                                </Dropdown.Item>
                                                                <Dropdown.Item
                                                                    className="optionRejected"
                                                                    href="#"
                                                                    onClick={() =>
                                                                        this.setState( {
                                                                            ...this.state,
                                                                            changeStatusModal: true,
                                                                            statusSelected: 11
                                                                        } )}
                                                                >
                                                                    <Tooltip
                                                                        title="The talent is rejected (Interview level/ Missing Skills/ Capability)">
                                                                        <span><FontAwesomeIcon icon={faCircle} className="mr-2" /> Rejected</span>
                                                                    </Tooltip>
                                                                </Dropdown.Item>
                                                                <Dropdown.Item
                                                                    className="optionTOReceived"
                                                                    href="#"
                                                                    onClick={() =>
                                                                        this.changeStatusOfTalent( 20 )}
                                                                >
                                                                    <Tooltip
                                                                        title="Task Order Received from the client">
                                                                        <span><FontAwesomeIcon icon={faFileDownload} className="mr-2" /> TO Received</span>
                                                                    </Tooltip>
                                                                </Dropdown.Item>
                                                                <Dropdown.Item
                                                                    className="optionOfferReleased"
                                                                    href="#"
                                                                    onClick={() =>
                                                                        this.changeStatusOfTalent( 21 )}
                                                                >
                                                                    <Tooltip
                                                                        title="Offer Letter is released to the talent">
                                                                        <span><FontAwesomeIcon icon={faFileInvoiceDollar} className="mr-2" /> Offer Released</span>
                                                                    </Tooltip>
                                                                </Dropdown.Item>

                                                                <Dropdown.Item
                                                                    className="optionOnBoarded"
                                                                    href="#"
                                                                    onClick={() =>
                                                                        this.setState( {
                                                                            ...this.state,
                                                                            changeStatusModal: true,
                                                                            statusSelected: 13
                                                                        } )}
                                                                >
                                                                    <Tooltip title="The talent started the job">
                                                                        <span><FontAwesomeIcon icon={faFlagCheckered} className="mr-2" /> Onboarded</span>
                                                                    </Tooltip>
                                                                </Dropdown.Item>
                                                                <Dropdown.Item
                                                                    className="optionDropped"
                                                                    href="#"
                                                                    onClick={() =>
                                                                        this.setState( {
                                                                            ...this.state,
                                                                            changeStatusModal: true,
                                                                            statusSelected: 19
                                                                        } )}
                                                                >
                                                                    <Tooltip title="Talent or Client dropped">
                                                                        <span><FontAwesomeIcon icon={faUserTimes} className="mr-2" /> Dropped</span>
                                                                    </Tooltip>
                                                                </Dropdown.Item>
                                                            </Dropdown.Menu>
                                                        </Dropdown>
                                                    ),
                                                    tooltip: '',
                                                    isFreeAction: false,
                                                    onClick: () => null,
                                                },
                                                {
                                                    icon: () => (
                                                        <div className={'btn btn-success btn-sm'}>
                                                            <FontAwesomeIcon
                                                                icon={faFileExport}
                                                                className="mr-2"
                                                            />
                                                            Export
                                                        </div>
                                                    ),
                                                    tooltip: 'Export',
                                                    isFreeAction: true,
                                                    onClick: () =>
                                                        util.DownloadTableAsCsv(
                                                            'MuiTable-root',
                                                            2,
                                                            'Talents_' +
                                                            this.state.position.job_title.replace( ' ', '_' )
                                                        ),
                                                },
                                                {
                                                    icon: () => (
                                                        <div
                                                            className={'btn btn-primary btn-sm'}
                                                            id="btnAddTalent"
                                                        >
                                                            <FontAwesomeIcon
                                                                icon={faPlusCircle}
                                                                className="mr-2"
                                                            />
                                                            Add Talent
                                                        </div>
                                                    ),
                                                    tooltip: 'Add Talent',
                                                    isFreeAction: true,
                                                    hidden: this.state.position.status === 3 ||
                                                        this.state.position.status === 4,
                                                    onClick: () => this.addCandidate(),
                                                },
                                                {
                                                    icon: () => (
                                                        <div
                                                            className={'btn btn-info btn-sm'}
                                                            id="btnSubmitTalent"
                                                        >
                                                            <FontAwesomeIcon
                                                                icon={faThumbsUp}
                                                                className="mr-2"
                                                            />
                                                            Submit Talent
                                                        </div>
                                                    ),
                                                    tooltip: 'Submit Talent',
                                                    isFreeAction: true,
                                                    hidden: this.state.position.status === 3 ||
                                                        this.state.position.status === 4,
                                                    onClick: () => this.submitTalentsModal(),
                                                },
                                                {
                                                    tooltip: 'Remove All Selected Candidates',
                                                    icon: () => <FontAwesomeIcon icon={faTrashAlt}/>,
                                                    onClick: ( evt, data ) => {
                                                        this.setState( { data, deleteTalentsShow: true } );
                                                        // this.deleteCandidates(data)
                                                    },
                                                },
                                                {
                                                    tooltip: 'Stop Process',
                                                    icon: () => (
                                                        <div className={'btn JobDetailButtonOrange btn-sm'}>
                                                            <FontAwesomeIcon icon={faBan} className="mr-2"/>
                                                            Stop Process
                                                        </div>
                                                    ),
                                                    onClick: ( evt, data ) => {
                                                        let ids = [];
                                                        data.forEach( talent => {
                                                            ids.push( talent.id );
                                                        } );
                                                        this.setState( {
                                                            stopProcessTalentShow: true,
                                                            data,
                                                            ids,
                                                        } );
                                                    },
                                                },
                                                // {
                                                //     tooltip: 'Restart Process',
                                                //     icon: () => (
                                                //         <div className={'btn btn-danger btn-sm'}>
                                                //             <FontAwesomeIcon icon={faBan} className="mr-2"/>
                                                //             Restart Talent Process
                                                //         </div>
                                                //     ),
                                                //     onClick: ( evt, data ) => {
                                                //         let ids = [];
                                                //         console.log( data );
                                                //         data.forEach( talent => {
                                                //             ids.push( talent.id );
                                                //         } );
                                                //         this.setState( {
                                                //             reStartProcessTalentShow: true,
                                                //             data,
                                                //             ids,
                                                //         } );
                                                //     },
                                                // },
                                            ]}
                                            detailPanel={[
                                                {
                                                    tooltip: 'Timeline Process',
                                                    render: data => {
                                                        return <TimeLineCandidate data={data}/>;
                                                    },
                                                },
                                            ]}
                                            localization={{
                                                toolbar: {
                                                    searchPlaceholder: 'Search by Name, Email and Phone',
                                                },
                                            }}
                                            onRowClick={( event, rowData, togglePanel ) => {
                                                togglePanel();
                                            }}
                                        />
                                    </MuiThemeProvider>
                                </div>
                                {
                                    this.state.showDrawer ?
                                        <CtcDrawer
                                            show={this.state.showDrawer}
                                            closeDrawer={()=>this.setState( { showDrawer: false } )}
                                            job_id={this.state.talentRowData.job.id}
                                            candidate_id={this.state.talentRowData.candidate_id}
                                            reloadData={()=> this.showCandidatesOfPosition( this.state.position_id )}
                                        />
                                        :
                                        null
                                }
                                <Fragment>
                                    {this.state.showModalDocuments
                                        ? <ListOnboardedTalents
                                            data={this.state.position}
                                            hideModal={() =>
                                                this.setState( {
                                                    ...this.state,
                                                    showModalDocuments: false,
                                                } )}
                                            show={this.state.showModalDocuments}
                                        />
                                        : null}
                                    {this.state.deleteTalentShow
                                        ? <SweetAlert
                                            show={this.state.deleteTalentShow}
                                            warning
                                            showCancel
                                            confirmBtnText="Yes, remove it!"
                                            confirmBtnBsStyle="danger"
                                            title="Are you sure?"
                                            onConfirm={() => this.removeCandidateFromPosition()}
                                            onCancel={() =>
                                                this.setState( { deleteTalentShow: false } )}
                                            focusCancelBtn
                                        >
                                            Do you really want to remove this talent from the position?
                                        </SweetAlert>
                                        : ''}

                                    {this.state.deleteTalentsShow
                                        ? <SweetAlert
                                            show={this.state.deleteTalentsShow}
                                            warning
                                            showCancel
                                            confirmBtnText="Yes, remove it!"
                                            confirmBtnBsStyle="danger"
                                            title="Are you sure?"
                                            onConfirm={() => this.deleteCandidates()}
                                            onCancel={() =>
                                                this.setState( { deleteTalentsShow: false } )}
                                            focusCancelBtn
                                        >
                                            Do you really want to remove this talent from the position?
                                        </SweetAlert>
                                        : ''}

                                    {this.state.changeStatusShow
                                        ? <SweetAlert
                                            show={this.state.changeStatusShow}
                                            warning
                                            showCancel
                                            confirmBtnText="Yes, change it!"
                                            confirmBtnBsStyle="danger"
                                            title="Are you sure?"
                                            onConfirm={() => this.onConfirmChangeStatus()}
                                            onCancel={() =>
                                                this.setState( { changeStatusShow: false } )}
                                            focusCancelBtn
                                        >
                                            <div className="">
                                                You will change status of this job position from
                                                {' '}
                                                <b>{util.statusJP( this.state.position.status )}</b>
                                                {' '}
                                                to
                                                {' '}
                                                <b>
                                                    {this.state.position.status === 1 ? 'Hold' : 'Active'}
                                                </b>
                                                .
                                            </div>
                                            <div>
                                                <br/>
                                                <label htmlFor="sendEmailCheckbox">
                                                    <input id="sendEmailCheckbox"
                                                        type="checkbox"
                                                        className="mr-1"
                                                        name="sendEmailCheckbox"
                                                        onClick={this.sendEmailCheckbox}/>
                                                    Send email notification to talents
                                                </label>
                                            </div>
                                        </SweetAlert>
                                        : ''}

                                    {this.state.changeStatusModal
                                        ? <SweetAlert
                                            show={this.state.changeStatusModal}
                                            warning
                                            showCancel
                                            confirmBtnText="Yes!"
                                            confirmBtnBsStyle="warning"
                                            title="Are you sure?"
                                            onConfirm={() => this.changeStatusOfTalent( this.state.statusSelected )}
                                            onCancel={() =>
                                                this.setState( { changeStatusModal: false, statusSelected: null } )}
                                            focusCancelBtn
                                        >
                                            
                                            <div className="">This action cannot be undone</div>
                                        </SweetAlert>
                                        : ''}

                                    {this.state.positionFilledShow
                                        ? <SweetAlert
                                            show={this.state.positionFilledShow}
                                            warning
                                            showCancel
                                            confirmBtnText="Yes, is filled!"
                                            confirmBtnBsStyle="success"
                                            title="Are you sure?"
                                            onConfirm={() => this.onPositionFilled()}
                                            onCancel={() =>
                                                this.setState( { positionFilledShow: false } )}
                                            focusCancelBtn
                                        >
                                            <div className="">You will mark this job position as Filled</div>
                                            <div>
                                                <br/>
                                                <label htmlFor="sendEmailCheckbox">
                                                    <input id="sendEmailCheckbox"
                                                        type="checkbox"
                                                        className="mr-1"
                                                        name="sendEmailCheckbox"
                                                        onClick={this.sendEmailCheckbox}/>
                                                    Send email notification to talents
                                                </label>
                                            </div>
                                        </SweetAlert>
                                        : ''}

                                    {this.state.stopProcessShow
                                        ? <SweetAlert
                                            show={this.state.stopProcessShow}
                                            warning
                                            showCancel
                                            confirmBtnText="Yes, stop it!"
                                            confirmBtnBsStyle="danger"
                                            title="Are you sure?"
                                            onConfirm={() => this.onConfirmStopProcess()}
                                            onCancel={() =>
                                                this.setState( { stopProcessShow: false } )}
                                            focusCancelBtn
                                        >
                                            <div className="">You will stop this position.</div>
                                            <div>
                                                <br/>
                                                <label htmlFor="sendEmailCheckbox">
                                                    <input id="sendEmailCheckbox" 
                                                        type="checkbox"
                                                        className="mr-1"
                                                        name="sendEmailCheckbox" 
                                                        onClick={this.sendEmailCheckbox}/>
                                                    Send email notification to talents
                                                </label>
                                            </div>
                                        </SweetAlert>
                                        : ''}

                                    {this.state.stopProcessTalentShow
                                        ? <StopProcess
                                            modalVisible={this.state.stopProcessTalentShow}
                                            hideModal={this.hideModalStopProcess}
                                            ids={this.state.ids}
                                            position_id={this.state.position_id}
                                        />
                                        : ''}
                                    {this.state.reStartProcessTalentShow
                                        ? <RestartProcess
                                            modalVisible={this.state.reStartProcessTalentShow}
                                            hideModal={this.hideModalReStartProcess}
                                            ids={this.state.ids}
                                            position_id={this.state.position_id}
                                        />
                                        : ''}
                                </Fragment>

                            </AccordionDetails>
                        </Accordion>
                    </div>
                </div>
                <ModalAddCandidate
                    position_id={this.state.position_id}
                    hideModal={this.hideModal}
                    modalVisible={this.state.modalVisible}
                    refreshTalentTable={this.refreshTalentTable}
                />
                {this.state.submitModal
                    ? <SubmitTalentModal
                        show={this.state.submitModal}
                        closeHandler={() => this.setState( { submitModal: false } )}
                        candidates={this.props.candidates}
                        job={this.state.position}
                    />
                    : ''}

                {util.LOADING_SCREEN( this.state.backDropOpen )}
            </Fragment>
        );
    }
}

export default connect( mapStateToProps, mapDispatchToProps )( PositionDetail );

function TitleExpansion( { position } ) {
    // Construct the title based on several fields, at the end adds the status of the job position
    let job_id = String( position.id ).padStart( 5, '0' );
    let partner = position.partner ? position.partner.company : '';
    let client = position.client ? position.client.company : '';
    let city = position.city ? position.city : '';
    let state = position.state ? position.state : '';
    let country = position.country ? position.country : '';
    let job_title = position.job_title;
    let title = job_id + ' - ';

    if ( client !== '' ) {
        title += client + ' - ';
    }
    if ( partner !== '' ) {
        title += partner + ' - ';
    }
    if ( city !== '' ) {
        title += city + ', ';
    }
    if ( state !== '' ) {
        title += selector.getStateAbbreviation( state ) + ', ';
    }
    if ( country !== '' ) {
        title += selector.getCountryAbbreviation( country ) + ' - ';
    }
    if ( job_title !== '' ) {
        title += job_title;
    }
    title += ` -  Status: `;

    return (
        <b className={'titleExpandible'}>
            {title} { util.jobStatusOnlyIcons( position.status ) }
        </b>
    );
}

function ChangeSaleRate( props ) {
    const [typeInput] = useState( props.typeInput );
    const [form, setForm] = useState( false );
    const [value, setValue] = useState( () => {
        switch ( props.typeInput ) {
            case 1:
                return props.data.employment_type === null
                    ? 0
                    : parseFloat( props.data.employment_type );
            case 2:
                return props.data['talent_expectation'] === null
                    ? 0
                    : parseFloat( props.data['talent_expectation'] );
            case 3:
                return props.data.buy_rate === null
                    ? 0
                    : parseFloat( props.data.buy_rate );
            case 4:
                return props.data['talent_sell_rate'] === null
                    ? 0
                    : parseFloat( props.data['talent_sell_rate'] );
            default:
                break;
        }
    } );

    const [valueBase] = useState( () => {
        switch ( props.typeInput ) {
            case 1:
                return props.data.employment_type === null
                    ? 0
                    : parseFloat( props.data.employment_type );
            case 2:
                return props.data['talent_expectation'] === null
                    ? 0
                    : parseFloat( props.data['talent_expectation'] );
            case 3:
                return props.data.buy_rate === null
                    ? 0
                    : parseFloat( props.data.buy_rate );
            case 4:
                return props.data['talent_sell_rate'] === null
                    ? 0
                    : parseFloat( props.data['talent_sell_rate'] );
            default:
                break;
        }
    } );

    useEffect(
        () => {
            setValue( () => {
                switch ( props.typeInput ) {
                    case 1:
                        return props.data.employment_type === null
                            ? 0
                            : parseFloat( props.data.employment_type );
                    case 2:
                        return props.data['talent_expectation'] === null
                            ? 0
                            : parseFloat( props.data['talent_expectation'] );
                    case 3:
                        return props.data.buy_rate === null
                            ? 0
                            : parseFloat( props.data.buy_rate );
                    case 4:
                        return props.data['talent_sell_rate'] === null
                            ? 0
                            : parseFloat( props.data['talent_sell_rate'] );
                    default:
                        break;
                }
            } );
        },
        [props]
    );

    async function handleChangeSaleRate() {
        if ( form ) {
            try {
                const { position_id, candidate_id } = props.data;
                let data = { field: typeInput, value: parseFloat( value.toString() ) };
                const request = await util.axios.patch(
                    `${util.url}/job/update_talent_position_rates/${position_id}/${candidate_id}`,
                    data
                );
                const { error, msg } = request.data;
                if ( error ) throw msg;
                setForm( !form );
                props.updateChange();
            } catch ( e ) {
                util.handleError( e );
            }
        } else {
            setForm( !form );
        }
    }

    function handleChange( e ) {
        // Update sale rate on API
        let { value } = e.target;
        if ( value === '' ) value = 0;
        setValue( parseFloat( value.toString() ) );
    }

    function handleCancel() {
        setValue( valueBase );
        setForm( !form );
    }

    if ( form ) {
        return (
            <Fragment>
                <input
                    autoFocus={true}
                    onKeyDown={e => {
                        if ( e.key === 'Enter' ) {
                            handleChangeSaleRate().then( null );
                        }
                        if ( e.key === 'Escape' ) {
                            handleCancel();
                        }
                    }}
                    className="w-50 mr-1"
                    value={value}
                    onChange={handleChange}
                />
                <FontAwesomeIcon
                    title="Update Sale Rating"
                    onClick={() => handleChangeSaleRate()}
                    className="isPointer text-success"
                    icon={faSave}
                />
                <FontAwesomeIcon
                    title="Cancel Action"
                    onClick={() => handleCancel()}
                    className="text-danger ml-1"
                    icon={faBan}
                />
            </Fragment>
        );
    } else {
        return (
            <Fragment>
                <span onClick={() => handleChangeSaleRate()}>
                    <span className="mr-1">
                        {util.currencyFormat( value, props.data.job.country )}
                    </span>
                    <FontAwesomeIcon
                        className="isPointer text-muted iconSizeSmall"
                        icon={faPencilAlt}
                    />
                </span>
            </Fragment>
        );
    }
}

function TimeLineCandidate( props ) {
    const c = props.data;
    const ids = [props.data.id];
    const candidateStatus = parseInt( c.status );
    const [candidate] = useState( props.data );
    const [firstContact] = useState( c['first_contact'] );
    const [internalReview] = useState( c['internal_review'] );
    const [clientInterviews] = useState( c['client_interviews'] );
    const [onBoardingDocs] = useState( c['onboarding_documents'] );
    const [backgroundCheck] = useState( c['background_check'] );
    const [finalDecision] = useState( c.final_decision );
    const [show, setShow] = useState( false );
    const [showRestart, setShowRestart] = useState( false );
    const [panel, setPanel] = useState( 'panel1' );

    const LockedSection = ( { title } ) => {
        return (
            <p className="text-muted">
                <FontAwesomeIcon icon={faLock}/> {title} is not available
            </p>
        );
    };

    function hideModal() {
        setShow( false );
    }

    function hideModalRestart() {
        setShowRestart( false );
    }

    function changePanel( panelSelected ) {
        if ( panel === panelSelected ) {
            setPanel( '' );
        } else {
            setPanel( panelSelected );
        }
    }

    return (
        <Fragment>
            <div className="container-fluid mb-2">
                <div className="d-flex justify-content-between">
                    <h3 className="text-muted py-0">
                        <p className="p-1">Talent Process</p>
                        {candidate['status_note'] && candidateStatus === 19
                            ? <span className="text-danger">{candidate['status_note']}</span>
                            : ''}
                    </h3>
                    {
                        candidateStatus !== 13 ? // TODO pending to add resignation flow
                        
                            candidateStatus === 19
                                ? <div className="text-right">
                                    <Button
                                        onClick={() => setShowRestart( true )}
                                        size="sm"
                                        variant="success"
                                    >
                                        <FontAwesomeIcon icon={faSyncAlt} className="mr-1"/>
                                Restart Process
                                    </Button>
                                </div>
                                : <div className="text-right">
                                    <Button
                                        onClick={() => setShow( true )}
                                        size="sm"
                                        variant="danger"
                                    >
                                        <FontAwesomeIcon
                                            icon={faExclamationCircle}
                                            className="mr-1"
                                        />
                                Stop Process
                                    </Button>
                                </div>
                        
                            :
                            null
                    }
                </div>
                {/*Validate what should be displayed according with status of the candidate*/}
                <Accordion
                    expanded={panel === 'panel1'}
                    onChange={() => changePanel( 'panel1' )}
                >
                    <AccordionSummary expandIcon={<FontAwesomeIcon icon={faCaretDown}/>}>
                        <span className="mr-2">
                            {candidateStatus > 1
                                ? <FontAwesomeIcon className="text-success" icon={faCheck}/>
                                : <FontAwesomeIcon icon={faClock} className="text-muted"/>}
                        </span>
                        First Contact
                    </AccordionSummary>
                    <AccordionDetails>
                        <div className="container-fluid">
                            <Step1 data={firstContact} candidate={candidate}/>
                        </div>
                    </AccordionDetails>
                </Accordion>

                <Accordion
                    expanded={panel === 'panel2'}
                    onChange={() => changePanel( 'panel2' )}
                >
                    <AccordionSummary expandIcon={<FontAwesomeIcon icon={faCaretDown}/>}>
                        <span className="mr-2">
                            {candidateStatus > 2
                                ? <FontAwesomeIcon className="text-success" icon={faCheck}/>
                                : <FontAwesomeIcon icon={faClock} className="text-muted"/>}
                        </span>
                        Internal Interview
                    </AccordionSummary>
                    <AccordionDetails>
                        <div className="container-fluid">
                            {candidateStatus > 1
                                ? <Step2 data={internalReview} candidate={candidate}/>
                                : <LockedSection title="Internal review"/>}
                        </div>
                    </AccordionDetails>
                </Accordion>

                <Accordion
                    expanded={panel === 'panel3'}
                    onChange={() => changePanel( 'panel3' )}
                >
                    <AccordionSummary expandIcon={<FontAwesomeIcon icon={faCaretDown}/>}>
                        <span className="mr-2">
                            {candidateStatus > 3
                                ? <FontAwesomeIcon className="text-success" icon={faCheck}/>
                                : <FontAwesomeIcon icon={faClock} className="text-muted"/>}
                        </span>
                        Client Evaluation
                    </AccordionSummary>
                    <AccordionDetails>
                        <div className="container-fluid">

                            {candidateStatus > 2
                                ? <Step3 data={clientInterviews} candidate={candidate}/>
                                : <LockedSection title="Client Evaluation"/>}
                        </div>
                    </AccordionDetails>
                </Accordion>

                <Accordion
                    expanded={panel === 'panel4'}
                    onChange={() => changePanel( 'panel4' )}
                >
                    <AccordionSummary expandIcon={<FontAwesomeIcon icon={faCaretDown}/>}>
                        <span className="mr-2">
                            {candidateStatus > 4
                                ? <FontAwesomeIcon className="text-success" icon={faCheck}/>
                                : <FontAwesomeIcon icon={faClock} className="text-muted"/>}
                        </span>
                        Onboarding Docs
                    </AccordionSummary>
                    <AccordionDetails>
                        <div className="container-fluid">

                            {candidateStatus > 3
                                ? <Step4 data={onBoardingDocs} candidate={candidate}/>
                                : <LockedSection title="Onboarding documents"/>}
                        </div>
                    </AccordionDetails>
                </Accordion>

                <Accordion
                    expanded={panel === 'panel5'}
                    onChange={() => changePanel( 'panel5' )}
                >
                    <AccordionSummary expandIcon={<FontAwesomeIcon icon={faCaretDown}/>}>
                        <span className="mr-2">
                            {candidateStatus > 5
                                ? <FontAwesomeIcon className="text-success" icon={faCheck}/>
                                : <FontAwesomeIcon icon={faClock} className="text-muted"/>}
                        </span>
                        Background Check
                    </AccordionSummary>
                    <AccordionDetails>
                        <div className="container-fluid">

                            {candidateStatus > 4
                                ? <Step5 data={backgroundCheck} candidate={candidate}/>
                                : <LockedSection title="Background check"/>}
                        </div>
                    </AccordionDetails>
                </Accordion>

                <Accordion
                    expanded={panel === 'panel6'}
                    onChange={() => changePanel( 'panel6' )}
                >
                    <AccordionSummary expandIcon={<FontAwesomeIcon icon={faCaretDown}/>}>
                        <span className="mr-2">
                            {candidateStatus > 9
                                ? <FontAwesomeIcon className="text-success" icon={faCheck}/>
                                : <FontAwesomeIcon icon={faClock} className="text-muted"/>}
                        </span>
                        Final Decision
                    </AccordionSummary>
                    <AccordionDetails>
                        <div className="container-fluid">

                            {candidateStatus > 5
                                ? <Step6 data={finalDecision} candidate={candidate}/>
                                : <LockedSection title="Final decision"/>}
                        </div>
                    </AccordionDetails>
                </Accordion>
            </div>
            {show
                ? <StopProcess
                    modalVisible={show}
                    hideModal={hideModal}
                    ids={ids}
                    position_id={c.position_id}
                />
                : ''}
            {showRestart
                ? <RestartProcess
                    modalVisible={showRestart}
                    hideModal={hideModalRestart}
                    ids={ids}
                    position_id={c.position_id}
                />
                : ''}
        </Fragment>
    );
}

function mapStateToProps( state ) {
    return {
        candidates: state.jobPositionCandidates,
        position: state.jobPosition,
    };
}

function mapDispatchToProps( dispatch ) {
    return {
        setCandidates: data => dispatch( setCandidates( data ) ),
        setPosition: data => dispatch( setPosition( data ) ),
    };
}