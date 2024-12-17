/* eslint-disable jsx-a11y/label-has-associated-control */
/* eslint-disable jsx-a11y/control-has-associated-label */
import React, { useEffect, useRef, useState } from 'react';
import { Todo } from './types/Todo';
import * as todoService from './api/todos';
import { UserWarning } from './UserWarning';
import { USER_ID } from './api/todos';

export const App: React.FC = () => {
  // #region state
  const [allTodos, setAllTodos] = useState<Todo[]>([]);
  const [titleValue, setTitleValue] = useState('');
  const [selectedTodo, setSelectedTodo] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');

  const [inputLoading, setInputLoading] = useState(false);
  const [clearCompleted, setClearCompleted] = useState(false);
  const [tempTodo, setTempTodo] = useState<Todo | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  // #endregion
  // #region render

  // todos loading
  useEffect(() => {
    setErrorMessage('');

    todoService
      .getTodos()
      .then(todos => {
        setAllTodos(todos);
      })
      .catch(error => {
        setErrorMessage('Unable to load todos');
        throw error;
      });
  }, []);

  // focus
  useEffect(() => {
    if (!inputLoading && inputRef.current) {
      inputRef.current.focus();
    }
  }, [inputLoading]);

  // error message
  useEffect(() => {
    if (errorMessage) {
      const timer = setTimeout(() => {
        setErrorMessage('');
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [errorMessage]);

  // #endregion
  // #region change status
  // const handleChangeStatus = (todoId: number) => {};
  // #endregion
  // #region DONE delete todo
  const handleDeleteTodo = (todoId: number) => {
    setErrorMessage('');
    setSelectedTodo(todoId);
    todoService
      .deleteTodo(todoId)
      .then(() => {
        setAllTodos(currentTodos =>
          currentTodos.filter(todo => todo.id !== todoId),
        );
        if (inputRef.current) {
          inputRef.current.focus();
        }
      })
      .catch(error => {
        setErrorMessage('Unable to delete a todo');
        throw error;
      })
      .finally(() => {
        setSelectedTodo(null);
      });
  };

  const handleDeleteAllCompleted = async () => {
    setErrorMessage('');
    setClearCompleted(true);

    const completedTodos = allTodos.filter(todo => todo.completed === true);

    const deletePromises = completedTodos.map(todo =>
      todoService.deleteTodo(todo.id),
    );

    try {
      const results = await Promise.allSettled(deletePromises);

      const anyFailed = results.some(result => result.status === 'rejected');

      if (anyFailed) {
        setErrorMessage('Unable to delete a todo');
      }

      const remainingTodos = allTodos.filter(
        (todo, index) =>
          !(todo.completed === true && results[index].status === 'fulfilled'),
      );

      setAllTodos(remainingTodos);

      if (inputRef.current) {
        inputRef.current.focus();
      }
    } catch (error) {
      setErrorMessage('Unable to delete a todo');
    } finally {
      setClearCompleted(false);
    }
  };

  // #endregion
  // #region edit todo
  // const handleEditTodo = (todoId: number) => {};
  // #endregion
  // #region DONE add todo

  const handleAddTodo = (title: string) => {
    const trimmedTitle = title.trim();

    setErrorMessage('');
    setInputLoading(true);

    if (!trimmedTitle) {
      setErrorMessage('Title should not be empty');
      setInputLoading(false);
      if (inputRef.current) {
        inputRef.current.focus();
      }

      return;
    }

    const createTempTodo: Todo = {
      id: 0,
      userId: USER_ID,
      title: trimmedTitle,
      completed: false,
    };

    setTempTodo(createTempTodo);

    todoService
      .createTodo({ title: trimmedTitle, userId: USER_ID, completed: false })
      .then(newTodo => {
        setSelectedTodo(newTodo.id);
        setAllTodos(currentTodos => [...currentTodos, newTodo]);
        setTitleValue('');
        setTempTodo(null);
        if (inputRef.current) {
          inputRef.current.focus();
        }
      })
      .catch(error => {
        setErrorMessage('Unable to add a todo');
        setTitleValue(trimmedTitle);
        throw error;
      })
      .finally(() => {
        setTempTodo(null);
        setSelectedTodo(null);
        setInputLoading(false);
      });
  };
  // #endregion
  // #region DONE filter

  const showFilteredTodos = (filterType: string) => {
    setSelectedFilter(filterType);
  };

  const filteredTodos = allTodos.filter(todo => {
    if (selectedFilter === 'all') {
      return true;
    }

    if (selectedFilter === 'completed') {
      return todo.completed;
    }

    if (selectedFilter === 'active') {
      return !todo.completed;
    }

    return true;
  });
  // #endregion

  if (!USER_ID) {
    return <UserWarning />;
  }

  return (
    <div className="todoapp">
      <h1 className="todoapp__title">todos</h1>

      <div className="todoapp__content">
        <header className="todoapp__header">
          <button
            type="button"
            className={`todoapp__toggle-all ${allTodos.every(todo => todo.completed === true) ? 'active' : ''}`}
            data-cy="ToggleAllButton"
          />

          <form
            onSubmit={e => {
              e.preventDefault();
              handleAddTodo(titleValue);
            }}
          >
            <input
              data-cy="NewTodoField"
              type="text"
              className="todoapp__new-todo"
              placeholder="What needs to be done?"
              disabled={inputLoading}
              ref={inputRef}
              value={titleValue}
              onChange={event => setTitleValue(event.target.value)}
            />
          </form>
        </header>

        <section className="todoapp__main" data-cy="TodoList">
          {filteredTodos.map(todo => (
            <div
              data-cy="Todo"
              className={`todo ${todo.completed === true ? 'completed' : ''}`}
              key={todo.id}
              // onDoubleClick={() => handleEditTodo(todo.id)}
            >
              <label className="todo__status-label">
                <input
                  data-cy="TodoStatus"
                  type="checkbox"
                  className="todo__status"
                  checked={todo.completed}
                  // onChange={() => handleChangeStatus(todo.id)}
                />
              </label>

              <span data-cy="TodoTitle" className="todo__title">
                {todo.title}
              </span>

              <button
                type="button"
                className="todo__remove"
                data-cy="TodoDelete"
                onClick={() => handleDeleteTodo(todo.id)}
              >
                ×
              </button>

              <div
                data-cy="TodoLoader"
                className={`modal overlay ${selectedTodo === todo.id || (clearCompleted === true && todo.completed === true) ? 'is-active' : ''}`}
              >
                <div className="modal-background has-background-white-ter" />
                <div className="loader" />
              </div>
            </div>
          ))}

          {tempTodo && (
            <div data-cy="Todo" className="todo" key={tempTodo.id}>
              <label className="todo__status-label">
                <input
                  data-cy="TodoStatus"
                  type="checkbox"
                  className="todo__status"
                />
              </label>

              <span data-cy="TodoTitle" className="todo__title">
                {tempTodo.title}
              </span>

              <button
                type="button"
                className="todo__remove"
                data-cy="TodoDelete"
                onClick={() => handleDeleteTodo(tempTodo.id)}
              >
                ×
              </button>

              <div data-cy="TodoLoader" className={`modal overlay is-active`}>
                <div className="modal-background has-background-white-ter" />
                <div className="loader" />
              </div>
            </div>
          )}
        </section>

        {allTodos.length > 0 && (
          <footer className="todoapp__footer" data-cy="Footer">
            <span className="todo-count" data-cy="TodosCounter">
              {`${allTodos.filter(todo => todo.completed === false).length} items left`}
            </span>

            <nav className="filter" data-cy="Filter">
              <a
                href="#/"
                className={`filter__link ${selectedFilter === 'all' ? 'selected' : ''}`}
                data-cy="FilterLinkAll"
                onClick={() => showFilteredTodos('all')}
              >
                All
              </a>

              <a
                href="#/active"
                className={`filter__link ${selectedFilter === 'active' ? 'selected' : ''}`}
                data-cy="FilterLinkActive"
                onClick={() => showFilteredTodos('active')}
              >
                Active
              </a>

              <a
                href="#/completed"
                className={`filter__link ${selectedFilter === 'completed' ? 'selected' : ''}`}
                data-cy="FilterLinkCompleted"
                onClick={() => showFilteredTodos('completed')}
              >
                Completed
              </a>
            </nav>

            <button
              type="button"
              className="todoapp__clear-completed"
              data-cy="ClearCompletedButton"
              disabled={!allTodos.some(todo => todo.completed === true)}
              onClick={handleDeleteAllCompleted}
            >
              Clear completed
            </button>
          </footer>
        )}
      </div>

      {/* DON'T use conditional rendering to hide the notification */}
      {/* Add the 'hidden' class to hide the message smoothly */}
      <div
        data-cy="ErrorNotification"
        className={`notification is-danger is-light has-text-weight-normal ${errorMessage ? '' : 'hidden'}`}
      >
        <button
          data-cy="HideErrorButton"
          type="button"
          className="delete"
          onClick={() => setErrorMessage('')}
        />
        {errorMessage}
        {/* need to add - Unable to update a todo */}
      </div>
    </div>
  );
};
