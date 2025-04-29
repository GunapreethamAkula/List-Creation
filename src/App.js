import React, { useEffect, useState } from 'react';
import axios from 'axios';
import styled from 'styled-components';

const API_URL = 'https://apis.ccbp.in/list-creation/lists';

const Container = styled.div`
  padding: 20px;
  font-family: Arial, sans-serif;
  text-align: center;
`;

const Header = styled.div`
  margin-bottom: 20px;
`;

const Heading = styled.h1`
  margin: 0 0 10px;
`;

const Button = styled.button`
  padding: 10px 20px;
  background-color: #2563eb;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;

  &:disabled {
    background-color: #a5b4fc;
    cursor: not-allowed;
  }

  margin: 10px;
`;

const ListsWrapper = styled.div`
  display: flex;
  justify-content: center;
  gap: 20px;
`;

const ListContainer = styled.div`
  flex: 1;
  border-radius: 8px;
  background-color: #e0f2fe;
  padding: 10px;
  min-height: 400px;
  max-height: 500px;
  overflow-y: auto;
`;

const ListTitle = styled.h3`
  text-align: center;
  margin-bottom: 10px;
`;

const ListItem = styled.div`
  background-color: #fff;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 10px;
  position: relative;
`;

const ArrowLeft = styled.span`
  position: absolute;
  left: 8px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 22px;
  cursor: pointer;
`;

const ArrowRight = styled.span`
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 22px;
  cursor: pointer;
`;

const CenterControls = styled.div`
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-top: 20px;
`;

const ErrorMsg = styled.p`
  color: red;
`;

const Loader = styled.p`
  text-align: center;
`;

const FailureView = styled.div`
  text-align: center;
  margin-top: 100px;
`;

export default function App() {
  const [lists, setLists] = useState({});
  const [originalLists, setOriginalLists] = useState({});
  const [status, setStatus] = useState('LOADING');
  const [selectedLists, setSelectedLists] = useState([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newListItems, setNewListItems] = useState([]);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = () => {
    setStatus('LOADING');
    axios.get(API_URL)
      .then(res => {
        const grouped = {};
        res.data.lists.forEach(item => {
          const key = `List${item.list_number}`;
          if (!grouped[key]) grouped[key] = [];
          grouped[key].push(item);
        });
        setLists(grouped);
        setOriginalLists(grouped);
        setStatus('SUCCESS');
      })
      .catch(() => setStatus('FAILURE'));
  };

  const toggleListSelect = listName => {
    setErrorMsg('');
    setSelectedLists(prev => {
      if (prev.includes(listName)) return prev.filter(name => name !== listName);
      return prev.length < 2 ? [...prev, listName] : prev;
    });
  };

  const moveItem = (item, from, to) => {
    if (from === to) return;

    if (from === 'new') {
      setNewListItems(prev => prev.filter(i => i.id !== item.id));
    } else if (to === 'new') {
      setNewListItems(prev => [...prev, item]);
    }

    setLists(prev => {
      const updated = { ...prev };
      if (from !== 'new') updated[from] = updated[from].filter(i => i.id !== item.id);
      if (to !== 'new') updated[to] = [...(updated[to] || []), item];
      return updated;
    });
  };

  const handleCreateNewList = () => {
    if (selectedLists.length !== 2) {
      setErrorMsg('You should select exactly 2 lists to create a new list');
      return;
    }
    setIsCreating(true);
  };

  const handleCancel = () => {
    setIsCreating(false);
    setLists(originalLists);
    setSelectedLists([]);
    setNewListItems([]);
    setErrorMsg('');
  };

  const handleUpdate = () => {
    const maxListNum = Math.max(...Object.keys(lists).map(key => parseInt(key.replace('List', ''))));
    const newListName = `List${maxListNum + 1}`;
    const updatedLists = { ...lists, [newListName]: newListItems };

    const sortedKeys = Object.keys(updatedLists).sort((a, b) =>
      parseInt(a.replace('List', '')) - parseInt(b.replace('List', ''))
    );

    const sorted = {};
    sortedKeys.forEach(k => {
      sorted[k] = updatedLists[k];
    });

    setLists(sorted);
    setOriginalLists(sorted);
    setNewListItems([]);
    setIsCreating(false);
    setSelectedLists([]);
  };

  const renderList = (name, items) => {
    const isSelected = selectedLists.includes(name);

    return (
      <ListContainer
        key={name}
        onClick={() => !isCreating && toggleListSelect(name)}
        style={{ border: isSelected && !isCreating ? '2px solid #2563eb' : 'none' }}
      >
        <ListTitle>{name} ({items.length})</ListTitle>
        {items.map(item => (
          <ListItem key={item.id}>
            {isCreating && selectedLists[1] === name && (
              <ArrowLeft onClick={() => moveItem(item, name, 'new')}>&laquo;</ArrowLeft>
            )}
            <div>
              <strong>{item.title}</strong><br />
              <small>{item.description}</small>
            </div>
            {isCreating && selectedLists[0] === name && (
              <ArrowRight onClick={() => moveItem(item, name, 'new')}>&raquo;</ArrowRight>
            )}
          </ListItem>
        ))}
      </ListContainer>
    );
  };

  if (status === 'LOADING') return <Loader>Loading...</Loader>;
  if (status === 'FAILURE') {
    return (
      <FailureView>
        <p>Something went wrong</p>
        <Button onClick={fetchData}>Try Again</Button>
      </FailureView>
    );
  }

  const sortedListNames = Object.keys(lists).sort((a, b) =>
    parseInt(a.replace('List', '')) - parseInt(b.replace('List', ''))
  );

  const [leftList, rightList] = selectedLists;

  const renderLists = () => {
    if (!isCreating) {
      return sortedListNames.map(name => renderList(name, lists[name]));
    }

    const newListElement = (
      <ListContainer key="new">
        <ListTitle>New List ({newListItems.length})</ListTitle>
        {newListItems.map(item => (
          <ListItem key={item.id}>
            <ArrowLeft onClick={() => moveItem(item, 'new', leftList)}>&laquo;</ArrowLeft>
            <div>
              <strong>{item.title}</strong><br />
              <small>{item.description}</small>
            </div>
            <ArrowRight onClick={() => moveItem(item, 'new', rightList)}>&raquo;</ArrowRight>
          </ListItem>
        ))}
      </ListContainer>
    );

    return [
      renderList(leftList, lists[leftList]),
      newListElement,
      renderList(rightList, lists[rightList])
    ];
  };

  return (
    <Container>
      <Header>
        <Heading>List Creation</Heading>
        <Button onClick={handleCreateNewList}>Create New List</Button>
        {errorMsg && <ErrorMsg>{errorMsg}</ErrorMsg>}
      </Header>

      <ListsWrapper>
        {renderLists()}
      </ListsWrapper>

      {isCreating && (
        <CenterControls>
          <Button onClick={handleCancel}>Cancel</Button>
          <Button onClick={handleUpdate}>Update</Button>
        </CenterControls>
      )}
    </Container>
  );
}