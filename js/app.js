
class Todos extends React.Component {

    constructor(props) {

        super(props);

        this.state = {todos: [] };

        var credentials = {
            login: 'admin',
            password: 'publish'
        };

        this.capi = new eZ.CAPI(
            'http://react.local',
            new eZ.SessionAuthAgent(credentials)
        );

        this.contentService = this.capi.getContentService();

        this.capi.logIn( (error, response) => {

            if( error ){
                console.log('login failed');
            }

            this.loadStateFromEz();

        });

    }

    loadStateFromEz() {

        var query = this.contentService.newViewCreateStruct('todos-view', 'ContentQuery');

        query.body.ViewInput.ContentQuery.Criteria = {
            ContentTypeIdentifierCriterion: 'todo'
        };

        query.body.ViewInput.ContentQuery.limit = 100;

        this.contentService.createView(query, (error,response) => {

            if( error ) {
                console.log('Content fetch failing');
            }

            this.setState({todos: this.simplifyResults(response)});

        });

    }

    simplifyResults(response){

        var hits = response.document.View.Result.searchHits.searchHit;

        var todos = []; 

        for (var i in hits){

            var todo = {
                id: hits[i].value.Content._id,
                text: hits[i].value.Content.CurrentVersion.Version.Fields.field[0].fieldValue
            }

            todos.push(todo);

        };

        return todos;

    }

    changeHandler(){
        console.log('child updated');
        this.loadStateFromEz();
    }

    render() {
        return (
            <div>
                <h1>{this.props.title}</h1>

                <TodoItems todos={this.state.todos} />

                <TodoCreateForm
                    contentService={this.contentService}
                    onChange={this.changeHandler.bind(this)}
                    contentClassId={this.props.contentClassId}
                    rootPath={this.props.rootPath}    
                    languageId={this.props.languageId}
                />

            </div>
        );
    }
}

class TodoItems extends React.Component {

    render(){

        var todoNodes = this.props.todos.map(function(todo){
            return (
                <li key={ todo.id }>{ todo.text }</li>
            )
        });

        return (
            <ul>
                { todoNodes }
            </ul>
        );

    }

}

class TodoCreateForm extends React.Component {

    constructor(props){
        super(props);
        this.state = {newTodoText: ''};
    }

    createNewTodo(e){

        e.preventDefault();

        var locationStruct = this.props.contentService.newLocationCreateStruct(
                                    '/api/ezp/v2/content/locations' + this.props.rootPath
                            );
                            
        var contentCreateStruct = this.props.contentService.newContentCreateStruct(
                                    '/api/ezp/v2/content/types/' + this.props.contentClassId,
                                    locationStruct,
                                    this.props.languageId
                            );

        contentCreateStruct.addField('text',this.state.newTodoText);

        this.props.contentService.createContent(contentCreateStruct, (error, response) => {

            if( error ) {
                console.log('Unable to create content');
            } else {

                var createdObjectId = response.document.Content._id;
                this.props.contentService.publishVersion('/api/ezp/v2/content/objects/' + createdObjectId + '/versions/1', (error, response) => {

                    this.props.onChange();
                    this.setState({newTodoText: ''});

                });

            }

        });

    }

    onChange(e){
        this.setState({newTodoText: e.target.value})
    }

    render(){

        return(
            <form onSubmit={this.createNewTodo.bind(this)}>
                <input type="text" required="required" onChange={this.onChange.bind(this)} value={this.state.newTodoText} />
                <button>Add new todo</button>
            </form>
        )

    }

}

ReactDOM.render(
    <div>
        <Todos title="Todos" contentClassId="21" rootPath="/1/2" languageId="eng-GB" />
    </div>,
    document.getElementById('todos')
);
