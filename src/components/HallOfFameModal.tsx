import React, { useEffect, useState } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Text,
  Spinner,
  VStack,
  Box
} from '@chakra-ui/react';

const SUBGRAPH_URL = 'https://api.goldsky.com/api/public/project_cm8grmwci3q4001w1e6mz7wzu/subgraphs/whack-a-monkey/1.0.0/gn';

const HOF_QUERY = `{
  prizeClaims(first: 10, orderBy: timestamp, orderDirection: desc) {
    id
    winner
    amount
    score
    timestamp
  }
}`;

function formatAddress(addr: string) {
  return addr.slice(0, 6) + '...' + addr.slice(-4);
}

function formatDate(ts: string) {
  const d = new Date(parseInt(ts) * 1000);
  return d.toLocaleDateString() + ' ' + d.toLocaleTimeString();
}

const HallOfFameModal = ({ isOpen, onClose }) => {
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    setError(null);
    fetch(SUBGRAPH_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: HOF_QUERY })
    })
      .then(res => res.json())
      .then(data => {
        setEntries(data.data.prizeClaims);
        setLoading(false);
      })
      .catch(err => {
        setError('Failed to fetch Hall of Fame data.');
        setLoading(false);
      });
  }, [isOpen]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl" isCentered>
      <ModalOverlay />
      <ModalContent bg="#1D0838" color="yellow.100">
        <ModalHeader fontWeight="bold">Hall of Fame</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          {loading ? (
            <VStack py={8}><Spinner size="lg" /></VStack>
          ) : error ? (
            <Text color="red.300">{error}</Text>
          ) : (
            <Box overflowX="auto">
              <Table variant="simple" size="sm">
                <Thead>
                  <Tr>
                    <Th color="yellow.200">Winner</Th>
                    <Th color="yellow.200">Score</Th>
                    <Th color="yellow.200">Prize</Th>
                    <Th color="yellow.200">Date</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {entries.map((e) => (
                    <Tr key={e.id}>
                      <Td fontFamily="mono">{formatAddress(e.winner)}</Td>
                      <Td>{e.score}</Td>
                      <Td>{parseFloat(e.amount).toFixed(2)} $APE</Td>
                      <Td>{formatDate(e.timestamp)}</Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
              {entries.length === 0 && <Text color="gray.400" py={4}>No winners yet!</Text>}
            </Box>
          )}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default HallOfFameModal; 